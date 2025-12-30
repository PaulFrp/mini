from fastapi import APIRouter, HTTPException, Depends, Header
import json
from ..db import get_db
from ..models import Player, Room, WhoSaidItGameState
from ..game.websockets import manager
from ..game.who_said_it import (
    start_who_said_it_game,
    get_game_status_logic,
    submit_vote_logic,
    next_round_logic,
    QUOTE_POOL,
)
from pydantic import BaseModel

router = APIRouter()

class VoteSubmission(BaseModel):
    choice: str

@router.post("/start_game/{room_id}")
async def start_game(room_id: int, x_client_id: str = Header(None), db=Depends(get_db)):
    """Start a new Who Said It game"""
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room or room.creator != x_client_id:
        raise HTTPException(status_code=403, detail="Not allowed")
    
    players = db.query(Player).filter(Player.room_id == room_id).all()
    if len(players) < 2:
        raise HTTPException(status_code=400, detail="Need at least 2 players to start")
    
    usernames = [p.username for p in players]
    print(f"[START_WHO_SAID_IT_GAME] Room {room_id}: Starting game with {len(players)} players")
    
    start_who_said_it_game(room_id, usernames, room.creator)
    
    # Fetch state from DB to broadcast
    game_state = db.query(WhoSaidItGameState).filter(WhoSaidItGameState.room_id == room_id).first()
    current_quote = json.loads(game_state.current_quote) if game_state and game_state.current_quote else {}
    scores = json.loads(game_state.scores) if game_state and game_state.scores else {}
    broadcast_data = {
        "type": "game_update",
        "status": "voting",
        "players": usernames,
        "current_quote": current_quote,
        "scores": scores,
        "current_round": game_state.current_round if game_state else 1,
        "total_rounds": game_state.total_rounds if game_state else 10,
        "remaining": game_state.duration if game_state else 30,
    }
    
    print(f"[START_WHO_SAID_IT_GAME] Broadcasting to room {room_id}")
    active_connections = len(manager.active_connections.get(room_id, []))
    print(f"[START_WHO_SAID_IT_GAME] Active WebSocket connections in room {room_id}: {active_connections}")
    await manager.broadcast(room_id, broadcast_data)
    
    return {"status": "game started"}

@router.get("/game_status")
async def game_status(room_id: int, x_client_id: str = Header(None), db=Depends(get_db)):
    """Get current game status (REST fallback)"""
    status = await get_game_status_logic(room_id, x_client_id, db)
    return {"type": "game_update", **status}

@router.post("/submit_vote/{room_id}")
async def submit_vote(
    room_id: int,
    vote: VoteSubmission,
    x_client_id: str = Header(None),
    db=Depends(get_db)
):
    """Player votes for who said the quote"""
    result = await submit_vote_logic(room_id, x_client_id, vote.choice, db)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result

@router.post("/next_round/{room_id}")
async def next_round(room_id: int, x_client_id: str = Header(None), db=Depends(get_db)):
    """Start the next round"""
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room or room.creator != x_client_id:
        raise HTTPException(status_code=403, detail="Not allowed")
    
    result = await next_round_logic(room_id, db)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result

@router.get("/quotes")
def get_quotes():
    """Get all available quotes (for preview/admin)"""
    return QUOTE_POOL
