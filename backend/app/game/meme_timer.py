"""
Centralized meme game timer manager to prevent desync issues.
Handles phase transitions in the background instead of during individual player status requests.
"""
import asyncio
import time
import logging
import json
from .websockets import manager
from ..db import SessionLocal
from ..models import MemeGameState, Player

logger = logging.getLogger(__name__)

# Active meme game timers
_active_meme_timers = {}

ABSTAIN = "__abstain__"


def player_user_ids(game_state, db) -> list:
    """Resolve player user_ids from the game snapshot (not current room joiners)."""
    raw = json.loads(game_state.players) or []
    if not raw:
        return []

    submissions = json.loads(game_state.submissions)
    # New games store user_ids; keys in submissions confirm that format
    if submissions and any(p in submissions for p in raw):
        return list(raw)

    room_players = db.query(Player).filter_by(room_id=game_state.room_id).all()
    by_username = {p.username: p.user_id for p in room_players}
    if raw and raw[0] in by_username:
        return [by_username[p] for p in raw if p in by_username]

    # Assume raw already contains user_ids (new games before any submission)
    return list(raw)


def all_captions_submitted(game_state, db) -> bool:
    player_ids = player_user_ids(game_state, db)
    if not player_ids:
        return False
    submissions = json.loads(game_state.submissions)
    return len(submissions) >= len(player_ids)


def get_eligible_voters(players: list, submissions_dict: dict) -> list:
    """Players who can vote on at least one meme that isn't their own."""
    if not submissions_dict:
        return []
    return [p for p in players if any(sid != p for sid in submissions_dict)]


def should_skip_voting(players: list, submissions_dict: dict) -> bool:
    """Skip voting when nobody submitted or nobody can vote on anyone else's meme."""
    if not submissions_dict:
        return True
    return len(get_eligible_voters(players, submissions_dict)) == 0


def all_players_voted(game_state, db) -> bool:
    """True when every player who can vote has submitted a vote or skip (abstain)."""
    player_ids = player_user_ids(game_state, db)
    votes = json.loads(game_state.votes)
    submissions_dict = json.loads(game_state.submissions)
    if should_skip_voting(player_ids, submissions_dict):
        return True
    eligible = get_eligible_voters(player_ids, submissions_dict)
    return all(p in votes for p in eligible)


def _build_submissions_list(submissions_dict: dict, player_id_to_username: dict) -> list:
    return [
        {
            "user_id": player_id,
            "meme": sub["meme"],
            "captions": sub["captions"],
            "username": player_id_to_username.get(player_id, player_id),
        }
        for player_id, sub in submissions_dict.items()
    ]


async def transition_meme_to_results(room_id: int, db):
    """Move to results and broadcast to all players."""
    db.expire_all()
    game_state = db.query(MemeGameState).filter_by(room_id=room_id).first()
    if not game_state or game_state.phase == "results":
        return None
    if game_state.phase not in ("voting", "captioning"):
        return None

    game_state.phase = "results"

    points = json.loads(game_state.points)
    votes = json.loads(game_state.votes)
    vote_counts = {}
    for voted_for in votes.values():
        if not voted_for or voted_for == ABSTAIN:
            continue
        vote_counts[voted_for] = vote_counts.get(voted_for, 0) + 1

    winners = []
    if points:
        max_points = max(points.values(), default=0)
        winners = [p for p, pts in points.items() if pts == max_points]
    else:
        max_votes = max(vote_counts.values(), default=0)
        winners = [p for p, c in vote_counts.items() if c == max_votes]

    captions = json.loads(game_state.captions)
    submissions_dict = json.loads(game_state.submissions)
    players_in_room = db.query(Player).filter_by(room_id=room_id).all()
    player_id_to_username = {p.user_id: p.username for p in players_in_room}

    submissions_with_usernames = {
        player_id: {
            **sub,
            "username": player_id_to_username.get(player_id, player_id),
        }
        for player_id, sub in submissions_dict.items()
    }

    db.commit()

    payload = {
        "type": "game_update",
        "status": "results",
        "winners": winners,
        "votes": votes,
        "captions": captions,
        "submissions": submissions_with_usernames,
        "player_points": points,
        "vote_counts": vote_counts,
        "phase_epoch": game_state.start_time,
    }
    await manager.broadcast(room_id, payload)
    return payload


async def try_advance_from_captioning(room_id: int, db) -> bool:
    """Move captioning → voting (or results) when all submitted or time is up."""
    db.expire_all()
    game_state = db.query(MemeGameState).filter_by(room_id=room_id).first()
    if not game_state or game_state.phase != "captioning":
        return False

    now = time.time()
    remaining = int(game_state.duration - (now - game_state.start_time))
    if not all_captions_submitted(game_state, db) and remaining > 0:
        return False

    if all_captions_submitted(game_state, db):
        logger.info(f"[MEME_TIMER] Room {room_id}: All captions submitted")
    else:
        logger.info(f"[MEME_TIMER] Room {room_id}: Caption timer expired")

    await begin_voting_phase(room_id, db, now)
    return True


async def try_advance_from_voting(room_id: int, db) -> bool:
    """Move voting → results when all voted or time is up."""
    db.expire_all()
    game_state = db.query(MemeGameState).filter_by(room_id=room_id).first()
    if not game_state or game_state.phase != "voting":
        return False

    now = time.time()
    remaining = int(game_state.duration - (now - game_state.start_time))
    if not all_players_voted(game_state, db) and remaining > 0:
        return False

    if all_players_voted(game_state, db):
        logger.info(f"[MEME_TIMER] Room {room_id}: All players voted")
    else:
        logger.info(f"[MEME_TIMER] Room {room_id}: Voting timer expired")

    await transition_meme_to_results(room_id, db)
    return True


async def begin_voting_phase(room_id: int, db, now: float):
    """Start voting or skip directly to results when there is nothing to vote on."""
    db.expire_all()
    game_state = db.query(MemeGameState).filter_by(room_id=room_id).first()
    if not game_state or game_state.phase != "captioning":
        return

    player_ids = player_user_ids(game_state, db)
    submissions_dict = json.loads(game_state.submissions)

    if should_skip_voting(player_ids, submissions_dict):
        logger.info(f"[MEME_TIMER] Room {room_id}: No votable memes — skipping voting")
        await transition_meme_to_results(room_id, db)
        return

    game_state.phase = "voting"
    game_state.start_time = now
    game_state.duration = 60

    eligible = get_eligible_voters(player_ids, submissions_dict)
    votes = json.loads(game_state.votes)
    for player_id in player_ids:
        if player_id not in eligible and player_id not in votes:
            votes[player_id] = ABSTAIN
    game_state.votes = json.dumps(votes)
    db.commit()

    players_in_room = db.query(Player).filter_by(room_id=room_id).all()
    player_id_to_username = {p.user_id: p.username for p in players_in_room}
    submissions = _build_submissions_list(submissions_dict, player_id_to_username)

    await manager.broadcast(room_id, {
        "type": "game_update",
        "status": "voting",
        "submissions": submissions,
        "remaining": game_state.duration,
        "phase_epoch": game_state.start_time,
        "missing_submissions": [p for p in player_ids if p not in submissions_dict],
    })

    if all_players_voted(game_state, db):
        logger.info(f"[MEME_TIMER] Room {room_id}: All eligible players abstained — moving to results")
        await transition_meme_to_results(room_id, db)


async def meme_timer_loop(room_id: int):
    """
    Background task that monitors meme game state and triggers phase transitions.
    This runs independently of player requests to ensure all players see the same state.
    """
    logger.info(f"[MEME_TIMER] Starting meme game timer for room {room_id}")
    
    try:
        while True:
            with SessionLocal() as db:
                game_state = db.query(MemeGameState).filter_by(room_id=room_id).first()
                
                if not game_state:
                    logger.info(f"[MEME_TIMER] No game state found for room {room_id}, stopping timer")
                    break
                
                if game_state.phase == "captioning":
                    await try_advance_from_captioning(room_id, db)
                elif game_state.phase == "voting":
                    await try_advance_from_voting(room_id, db)
            
            # Sleep for 1 second before next check
            await asyncio.sleep(1)
            
    except asyncio.CancelledError:
        logger.info(f"[MEME_TIMER] Meme game timer cancelled for room {room_id}")
        raise
    except Exception as e:
        logger.error(f"[MEME_TIMER] Error in meme game timer for room {room_id}: {e}", exc_info=True)
    finally:
        logger.info(f"[MEME_TIMER] Meme game timer stopped for room {room_id}")
        if room_id in _active_meme_timers:
            del _active_meme_timers[room_id]

def start_meme_timer(room_id: int):
    """Start a background timer task for a meme game room"""
    if room_id in _active_meme_timers:
        logger.warning(f"[MEME_TIMER] Timer already running for room {room_id}")
        return
    
    task = asyncio.create_task(meme_timer_loop(room_id))
    _active_meme_timers[room_id] = task
    logger.info(f"[MEME_TIMER] Started timer task for room {room_id}")

def stop_meme_timer(room_id: int):
    """Stop the background timer task for a meme game room"""
    if room_id in _active_meme_timers:
        task = _active_meme_timers[room_id]
        task.cancel()
        del _active_meme_timers[room_id]
        logger.info(f"[MEME_TIMER] Stopped timer task for room {room_id}")

def get_active_meme_timers():
    """Get list of room IDs with active meme timers (for debugging)"""
    return list(_active_meme_timers.keys())
