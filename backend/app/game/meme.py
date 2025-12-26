import json, random, time, os
from ..models import Player, Room, MemeGameState
from datetime import datetime, timezone
from .websockets import manager
from .meme_timer import start_meme_timer, stop_meme_timer
from ..db import SessionLocal
import asyncio
import logging

BACKEND_DIR = os.path.join(os.path.dirname(__file__), "..", "..")
with open(os.path.join(BACKEND_DIR, "memes.json")) as f:
    MEME_POOL = json.load(f)

def start_meme_game(room_id: int, players: list[str], creator_id: str):
    meme_pool = MEME_POOL.copy()
    random.shuffle(meme_pool)
    current_meme = meme_pool.pop()
    
    with SessionLocal() as db:
        # Remove any existing game state for this room
        existing = db.query(MemeGameState).filter_by(room_id=room_id).first()
        if existing:
            db.delete(existing)
        
        # Create new game state
        game_state = MemeGameState(
            room_id=room_id,
            players=json.dumps(players),
            creator=creator_id,
            meme_pool=json.dumps(meme_pool),
            current_meme=json.dumps(current_meme),
            captions=json.dumps({}),
            votes=json.dumps({}),
            phase="captioning",
            start_time=time.time(),
            duration=60,
            points=json.dumps({}),
            submissions=json.dumps({})
        )
        db.add(game_state)
        db.commit()
    
    # Start background timer to handle phase transitions
    start_meme_timer(room_id)

# app/game/meme.py

async def get_game_status_logic(room_id, client_id, db):
    player = db.query(Player).filter_by(user_id=client_id, room_id=room_id).first()
    room = db.query(Room).filter_by(id=room_id).first()
    room_creator = room.creator if room else None

    if player:
        player.last_seen = datetime.now(timezone.utc)
        db.commit()

    game_state = db.query(MemeGameState).filter_by(room_id=room_id).first()
    if not game_state:
        return {"status": "no_game"}

    now = time.time()
    remaining = int(game_state.duration - (now - game_state.start_time))

    # Parse JSON fields
    players = json.loads(game_state.players)
    current_meme = json.loads(game_state.current_meme)
    captions = json.loads(game_state.captions)
    votes = json.loads(game_state.votes)
    points = json.loads(game_state.points)
    submissions = json.loads(game_state.submissions)

    # Prepare vote counts & winners - only if in voting or results
    vote_counts = {}
    winners = []
    if game_state.phase in ("voting", "results"):
        # Count votes for display purposes
        for v in votes.values():
            vote_counts[v] = vote_counts.get(v, 0) + 1
        
        # Calculate winners based on points
        if points:
            max_points = max(points.values(), default=0)
            winners = [p for p, pts in points.items() if pts == max_points]
        else:
            # Fallback to vote count if no points system
            max_votes = max(vote_counts.values(), default=0)
            winners = [p for p, c in vote_counts.items() if c == max_votes]

    if game_state.phase == "captioning":
        return {
            "status": "captioning",
            "current_meme": current_meme,
            "captions_submitted": len(captions),
            "players": players,
            "remaining": remaining,
            "is_creator": client_id == room_creator,
        }

    if game_state.phase == "voting":
        # Resolve usernames from database
        players_in_room = db.query(Player).filter_by(room_id=room_id).all()
        player_id_to_username = {p.user_id: p.username for p in players_in_room}
        
        return {
            "status": "voting",
            "submissions": [
                {
                    "user_id": player_id,
                    "meme": sub["meme"],
                    "captions": sub["captions"],
                    "username": player_id_to_username.get(player_id, player_id)
                }
                for player_id, sub in submissions.items()
            ],
            "remaining": remaining,
            "is_creator": client_id == room_creator,
        }

    if game_state.phase == "results":
        # Resolve usernames from database
        players_in_room = db.query(Player).filter_by(room_id=room_id).all()
        player_id_to_username = {p.user_id: p.username for p in players_in_room}
        
        # Add usernames to submissions for results display
        submissions_with_usernames = {
            player_id: {
                **sub,
                "username": player_id_to_username.get(player_id, player_id)
            }
            for player_id, sub in submissions.items()
        }

        return {
            "status": "results",
            "winners": winners,
            "votes": votes,
            "captions": captions,
            "submissions": submissions_with_usernames,
            "player_points": points,
            "can_proceed": player and client_id == room_creator,
            "is_creator": client_id == room_creator,
        }

    return {"status": "unknown"}



def next_meme_logic(room_id, client_id, db):
    player = db.query(Player).filter_by(user_id=client_id, room_id=room_id).first()
    room = db.query(Room).filter_by(id=room_id).first()
    room_creator = room.creator if room else None

    game_state = db.query(MemeGameState).filter_by(room_id=room_id).first()
    if not game_state or game_state.phase != "results":
        return {"status": "cannot_advance"}

    if not player or client_id != room_creator:
        return {"status": "unauthorized"}

    meme_pool = json.loads(game_state.meme_pool)
    if meme_pool:
        next_meme = meme_pool.pop()
        game_state.meme_pool = json.dumps(meme_pool)
        game_state.current_meme = json.dumps(next_meme)
        game_state.captions = json.dumps({})
        game_state.votes = json.dumps({})
        game_state.phase = "captioning"
        game_state.start_time = time.time()
        game_state.submissions = json.dumps({})
        game_state.points = json.dumps({})
        game_state.duration = 60
        db.commit()
        return {"status": "next_meme", "current_meme": next_meme}

    # Clean up game state when game is over
    db.delete(game_state)
    db.commit()
    return {"status": "game_over", "message": "No more memes"}
   
