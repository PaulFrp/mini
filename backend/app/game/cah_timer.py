"""
Background timer for Cards Against Humanity using DB-backed CAHGameState.
Handles phase transitions and broadcasts updates.
"""
import asyncio
import time
import logging
import random
import json
from ..db import SessionLocal
from ..models import CAHGameState
from .websockets import manager

logger = logging.getLogger(__name__)

_active_cah_timers = {}

async def cah_timer_loop(room_id: int):
    logger.info(f"[CAH_TIMER] Starting CAH timer for room {room_id}")
    try:
        while True:
            with SessionLocal() as db:
                game_state = db.query(CAHGameState).filter_by(room_id=room_id).first()
                if not game_state:
                    logger.info(f"[CAH_TIMER] No CAH state for room {room_id}, stopping")
                    break

                now = time.time()
                elapsed = now - game_state.start_time
                remaining = int(game_state.duration - elapsed)

                players = json.loads(game_state.players)
                submissions = json.loads(game_state.submissions)

                if game_state.phase == "playing":
                    non_czar_players = [p for p in players if p != game_state.card_czar]
                    all_submitted = all(p in submissions for p in non_czar_players)

                    if all_submitted or remaining <= 0:
                        logger.info(f"[CAH_TIMER] Room {room_id}: playing -> voting")
                        game_state.phase = "voting"
                        game_state.start_time = now
                        game_state.duration = 30
                        db.commit()

                        # Prepare submissions for voting
                        submission_list = [
                            {
                                "player": player_name,
                                "cards": cards,
                                "username": player_name,
                            }
                            for player_name, cards in submissions.items()
                            if player_name != game_state.card_czar
                        ]
                        random.shuffle(submission_list)

                        current_question = json.loads(game_state.current_question) if game_state.current_question else {}
                        scores = json.loads(game_state.scores)

                        await manager.broadcast(room_id, {
                            "type": "game_update",
                            "status": "voting",
                            "submissions": submission_list,
                            "remaining": game_state.duration,
                            "current_question": current_question,
                            "card_czar": game_state.card_czar,
                            "scores": scores,
                            "round": game_state.round,
                        })

                elif game_state.phase == "voting" and remaining <= 0:
                    logger.info(f"[CAH_TIMER] Room {room_id}: voting -> results")
                    game_state.phase = "results"

                    votes = json.loads(game_state.votes)
                    vote_counts = {}
                    for voted_for in votes.values():
                        vote_counts[voted_for] = vote_counts.get(voted_for, 0) + 1

                    # Award point to single winner
                    scores = json.loads(game_state.scores)
                    round_winner = None
                    if vote_counts:
                        max_votes = max(vote_counts.values())
                        winners = [p for p, v in vote_counts.items() if v == max_votes]
                        if len(winners) == 1:
                            scores[winners[0]] = scores.get(winners[0], 0) + 1
                            round_winner = winners[0]

                    game_state.scores = json.dumps(scores)
                    db.commit()

                    submissions = json.loads(game_state.submissions)
                    await manager.broadcast(room_id, {
                        "type": "game_update",
                        "status": "results",
                        "round_winner": round_winner,
                        "scores": scores,
                        "vote_counts": vote_counts,
                        "submissions": [
                            {
                                "player": player_name,
                                "cards": cards,
                                "votes": vote_counts.get(player_name, 0),
                            }
                            for player_name, cards in submissions.items()
                            if player_name != game_state.card_czar
                        ],
                    })

            await asyncio.sleep(1)
    except asyncio.CancelledError:
        logger.info(f"[CAH_TIMER] Timer cancelled for room {room_id}")
        raise
    except Exception as e:
        logger.error(f"[CAH_TIMER] Error in room {room_id}: {e}", exc_info=True)
    finally:
        logger.info(f"[CAH_TIMER] Timer stopped for room {room_id}")
        if room_id in _active_cah_timers:
            del _active_cah_timers[room_id]


def start_cah_timer(room_id: int):
    if room_id in _active_cah_timers:
        logger.warning(f"[CAH_TIMER] Already running for {room_id}")
        return
    task = asyncio.create_task(cah_timer_loop(room_id))
    _active_cah_timers[room_id] = task
    logger.info(f"[CAH_TIMER] Started for room {room_id}")


def stop_cah_timer(room_id: int):
    if room_id in _active_cah_timers:
        task = _active_cah_timers[room_id]
        task.cancel()
        del _active_cah_timers[room_id]
        logger.info(f"[CAH_TIMER] Stopped for room {room_id}")
