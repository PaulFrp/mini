from fastapi import APIRouter, HTTPException
from ..schemas import CaptionRequest
from fastapi import APIRouter, Depends, Request, Header, HTTPException
from ..db import get_db
from ..schemas import VoteRequest
from ..models import Player, Room, MemeGameState
from ..game.websockets import manager
import json

from ..game.meme import MEME_POOL  # import it


from ..game.meme import start_meme_game, get_game_status_logic


router = APIRouter()

@router.post("/start_game/{room_id}")
async def start_game(room_id: int, x_client_id: str = Header(None), db=Depends(get_db)):
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room or room.creator != x_client_id:
        raise HTTPException(status_code=403, detail="Not allowed")
    
    players = db.query(Player).filter(Player.room_id == room_id).all()
    usernames = [p.username for p in players]
    print(f"[START_GAME] Room {room_id}: Starting game with {len(players)} players")
    start_meme_game(room_id, usernames, room.creator)
    
    # Get the game state to broadcast
    game_state = db.query(MemeGameState).filter_by(room_id=room_id).first()
    if game_state:
        current_meme = json.loads(game_state.current_meme)
        broadcast_data = {
            "type": "game_update",
            "status": "captioning",
            "players": usernames,
            "current_meme": current_meme,
            "remaining": game_state.duration
        }
        print(f"[START_GAME] Broadcasting to room {room_id}: {broadcast_data}")
        print(f"[START_GAME] Active connections dict keys: {list(manager.active_connections.keys())}")
        print(f"[START_GAME] Looking for room_id: {room_id} (type: {type(room_id).__name__})")
        print(f"[START_GAME] Active connections in room {room_id}: {len(manager.active_connections.get(room_id, []))}")
        
        await manager.broadcast(room_id, broadcast_data)
        print(f"[START_GAME] Broadcast complete for room {room_id}")

    return {"status": "game started"}



@router.get("/templates")
def get_meme_templates():
    print("MEME_POOL", MEME_POOL)
    return MEME_POOL

# REST fallback: get current game status (used when WebSocket isn't connected yet)
@router.get("/game_status")
async def game_status(room_id: int, x_client_id: str = Header(None), db=Depends(get_db)):
    status = await get_game_status_logic(room_id, x_client_id, db)
    # Wrap in the same envelope used by websocket messages for consistency
    return {"type": "game_update", **status}