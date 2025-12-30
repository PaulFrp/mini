import json, random, time, os
from ..models import Player, Room, WhoSaidItGameState
from datetime import datetime, timezone
from .websockets import manager
from .who_said_it_timer import start_who_said_it_timer
from ..db import SessionLocal
import asyncio
import logging

# Load quotes
BACKEND_DIR = os.path.join(os.path.dirname(__file__), "..", "..")
with open(os.path.join(BACKEND_DIR, "who_said_it.json")) as f:
    QUOTE_POOL = json.load(f)

def start_who_said_it_game(room_id: int, players: list[str], creator_id: str):
    """Initialize a new Who Said It game and persist in DB"""
    # Shuffle quote pool
    quote_pool = QUOTE_POOL.copy()
    random.shuffle(quote_pool)

    # Take first quote
    current_quote = quote_pool.pop() if quote_pool else None

    with SessionLocal() as db:
        # Remove existing state for room
        existing = db.query(WhoSaidItGameState).filter_by(room_id=room_id).first()
        if existing:
            db.delete(existing)
            db.commit()

        game_state = WhoSaidItGameState(
            room_id=room_id,
            players=json.dumps(players),
            creator=creator_id,
            quote_pool=json.dumps(quote_pool),
            current_quote=json.dumps(current_quote) if current_quote else json.dumps({}),
            votes=json.dumps({}),
            phase="voting",
            start_time=time.time(),
            duration=30,
            scores=json.dumps({p: 0 for p in players}),
            current_round=1,
            total_rounds=10,
        )
        db.add(game_state)
        db.commit()
    
    # Start background timer to handle phase transitions
    start_who_said_it_timer(room_id)

async def get_game_status_logic(room_id, client_id, db):
    """Get current game status for a player"""
    player = db.query(Player).filter_by(user_id=client_id, room_id=room_id).first()
    room = db.query(Room).filter_by(id=room_id).first()
    room_creator = room.creator if room else None

    if player:
        player.last_seen = datetime.now(timezone.utc)
        db.commit()

    game_state = db.query(WhoSaidItGameState).filter_by(room_id=room_id).first()
    if not game_state:
        return {"status": "no_game"}

    now = time.time()
    remaining = int(game_state.duration - (now - game_state.start_time))
    
    # Get player's username
    player_username = player.username if player else client_id
    
    # Parse JSON fields
    current_quote = json.loads(game_state.current_quote) if game_state.current_quote else {}
    scores = json.loads(game_state.scores)
    votes = json.loads(game_state.votes)

    response = {
        "status": game_state.phase,
        "remaining": max(0, remaining),
        "current_quote": current_quote,
        "scores": scores,
        "current_round": game_state.current_round,
        "total_rounds": game_state.total_rounds,
        "has_voted": player_username in votes
    }
    
    # Add phase-specific data
    if game_state.phase == "results":
        # Count votes
        vote_counts = {}
        for choice in votes.values():
            vote_counts[choice] = vote_counts.get(choice, 0) + 1
        
        response["votes"] = vote_counts
        response["correct_answer"] = current_quote.get("correct_answer")
    
    return response

async def submit_vote_logic(room_id, client_id, choice, db):
    """Handle a player voting"""
    player = db.query(Player).filter_by(user_id=client_id, room_id=room_id).first()
    if not player:
        return {"error": "Player not found"}
    
    game_state = db.query(WhoSaidItGameState).filter_by(room_id=room_id).first()
    if not game_state or game_state.phase != "voting":
        return {"error": "Cannot vote now"}
    
    player_username = player.username
    
    # Check if player already voted
    votes = json.loads(game_state.votes)
    if player_username in votes:
        return {"error": "You already voted"}
    
    # Validate choice is valid
    current_quote = json.loads(game_state.current_quote)
    option_a = current_quote.get("option_a", {}).get("name")
    option_b = current_quote.get("option_b", {}).get("name")
    
    if choice not in [option_a, option_b]:
        return {"error": "Invalid choice"}
    
    votes[player_username] = choice
    
    # Update score if correct
    scores = json.loads(game_state.scores)
    if choice == current_quote.get("correct_answer"):
        scores[player_username] = scores.get(player_username, 0) + 1
    
    game_state.votes = json.dumps(votes)
    game_state.scores = json.dumps(scores)
    db.commit()
    
    return {"success": True}

async def next_round_logic(room_id, db):
    """Start the next round"""
    game_state = db.query(WhoSaidItGameState).filter_by(room_id=room_id).first()
    if not game_state or game_state.phase != "results":
        return {"error": "Cannot start next round"}
    
    # Check if game should end
    if game_state.current_round >= game_state.total_rounds:
        scores = json.loads(game_state.scores)
        max_score = max(scores.values()) if scores else 0
        winners = [p for p, s in scores.items() if s == max_score]
        
        await manager.broadcast(room_id, {
            "type": "game_over",
            "winners": winners,
            "final_scores": scores
        })
        return {"game_over": True, "winners": winners}
    
    # Get next quote
    quote_pool = json.loads(game_state.quote_pool)
    if not quote_pool:
        # No more quotes, end game
        scores = json.loads(game_state.scores)
        max_score = max(scores.values()) if scores else 0
        winners = [p for p, s in scores.items() if s == max_score]
        
        await manager.broadcast(room_id, {
            "type": "game_over",
            "winners": winners,
            "final_scores": scores
        })
        return {"game_over": True, "winners": winners}

    current_quote = quote_pool.pop()
    scores = json.loads(game_state.scores)
    
    game_state.quote_pool = json.dumps(quote_pool)
    game_state.current_quote = json.dumps(current_quote)
    game_state.votes = json.dumps({})
    game_state.phase = "voting"
    game_state.start_time = time.time()
    game_state.duration = 30
    game_state.current_round = (game_state.current_round or 0) + 1
    db.commit()
    
    # Broadcast new round
    await manager.broadcast(room_id, {
        "type": "game_update",
        "status": "voting",
        "current_quote": current_quote,
        "current_round": game_state.current_round,
        "total_rounds": game_state.total_rounds,
        "scores": scores,
        "remaining": game_state.duration
    })
    
    return {"success": True}
