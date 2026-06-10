from fastapi import APIRouter, Depends, Header, HTTPException
from ..schemas import CaptionRequest
from ..db import get_db
from ..models import Player, Room, MemeGameState
from ..game.websockets import manager
import json

from ..game.meme import MEME_POOL, start_meme_game, get_game_status_logic
from ..game.meme_timer import try_advance_from_captioning


router = APIRouter()

@router.post("/start_game/{room_id}")
async def start_game(room_id: int, x_client_id: str = Header(None), db=Depends(get_db)):
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room or room.creator != x_client_id:
        raise HTTPException(status_code=403, detail="Not allowed")
    
    players = db.query(Player).filter(Player.room_id == room_id).all()
    usernames = [p.username for p in players]
    player_ids = [p.user_id for p in players]
    print(f"[START_GAME] Room {room_id}: Starting game with {len(players)} players")
    start_meme_game(room_id, player_ids, room.creator)
    
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


@router.post("/submit_caption/{room_id}")
async def submit_caption(
    room_id: int,
    body: CaptionRequest,
    x_client_id: str = Header(None),
    db=Depends(get_db),
):
    """HTTP fallback when WebSocket is unavailable (Safari/Heroku idle drops)."""
    if not x_client_id:
        raise HTTPException(status_code=400, detail="x-client-id header is required")

    game_state = db.query(MemeGameState).filter_by(room_id=room_id).first()
    if not game_state or game_state.phase != "captioning":
        raise HTTPException(status_code=400, detail="Not in captioning phase")

    captions = body.captions or []
    current_meme = json.loads(game_state.current_meme)
    expected_slots = len(current_meme.get("caption_slots", []))
    if expected_slots and len(captions) != expected_slots:
        raise HTTPException(status_code=400, detail="Invalid caption count")

    captions_dict = json.loads(game_state.captions)
    submissions_dict = json.loads(game_state.submissions)

    captions_dict[x_client_id] = captions
    submissions_dict[x_client_id] = {
        "meme": current_meme,
        "captions": captions,
    }

    game_state.captions = json.dumps(captions_dict)
    game_state.submissions = json.dumps(submissions_dict)
    db.commit()

    advanced = await try_advance_from_captioning(room_id, db)
    if not advanced:
        status = await get_game_status_logic(room_id, x_client_id, db)
        await manager.broadcast(room_id, {"type": "game_update", **status})
    return {"status": "caption_submitted"}