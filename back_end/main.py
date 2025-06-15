from fastapi import FastAPI, Request, Response, Depends, Cookie
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from uuid import uuid4
from session import signer
from db import get_db, init_db
from models import Room
from contextlib import asynccontextmanager

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

app = FastAPI(lifespan=lifespan)

@app.post("/create_room")
def create_room(response: Response, db: Session = Depends(get_db)):
    room = Room(status="waiting")
    db.add(room)
    db.commit()
    db.refresh(room)
    cookie_value = signer.sign(str(room.id)).decode()
    response.set_cookie(key="room_session", value=cookie_value, httponly=True, samesite="none", secure=False)
    return {"room_id": room.id}

@app.post("/join_room/{room_id}")
def join_room(room_id: int, response: Response):
    cookie_value = signer.sign(str(room_id)).decode()
    response.set_cookie(key="room_session", value=cookie_value, httponly=True, samesite="none", secure=False)
    return {"message": f"Joined room {room_id}"}

@app.get("/room_messages")
def get_messages(room_session: str = Cookie(None)):
    try:
        room_id = signer.unsign(room_session).decode()
        return {"room_id": room_id, "messages": [f"Welcome to room {room_id}!"]}
    except Exception:
        return {"error": "Invalid or missing session"}
