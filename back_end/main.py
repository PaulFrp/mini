from fastapi import FastAPI, Request, Response, Depends, Cookie
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from uuid import uuid4
from session import signer
from db import get_db, init_db
from models import Room
from contextlib import asynccontextmanager
from fastapi import Header


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/create_room")
def create_room(response: Response, db: Session = Depends(get_db),  x_client_id: str = Header(None)):
    room = Room(status="waiting", creator=x_client_id)
    db.add(room)
    db.commit()
    db.refresh(room)
    cookie_value = signer.sign(str(room.id)).decode()
    response.set_cookie(key="room_session", value=cookie_value, httponly=True, samesite="lax", secure=False)
    return {"room_id": room.id}

@app.post("/join_room/{room_id}")
def join_room(room_id: int, response: Response):
    cookie_value = signer.sign(str(room_id)).decode()
    response.set_cookie(key="room_session", value=cookie_value, httponly=True, samesite="lax", secure=False)
    return {"message": f"Joined room {room_id}"}

@app.get("/room_messages")
def get_messages(
    room_session: str = Cookie(None),
    x_client_id: str = Header(None),
    db: Session = Depends(get_db),
):
    try:
        room_id = signer.unsign(room_session).decode()
        room = db.query(Room).filter(Room.id == int(room_id)).first()
        if not room:
            return {"error": "Room not found"}

        is_creator = room.creator == x_client_id
        return {
            "room_id": room_id,
            "messages": [f"Welcome to room {room_id}!"],
            "is_creator": is_creator,
        }
    except Exception:
        return {"error": "Invalid or missing session"}



rooms_status = {} 

@app.post("/start_game/{room_id}")
async def start_game(room_id: int):
    rooms_status[room_id] = "game_started"
    return {"status": "game started", "room_id": room_id}

@app.get("/room_status/{room_id}")
async def room_status(room_id: int):
    status = rooms_status.get(room_id, "waiting")
    return {"room_id": room_id, "status": status}
