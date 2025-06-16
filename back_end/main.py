from fastapi import FastAPI, Request, Response, Depends, Cookie
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from uuid import uuid4
from session import signer
from db import get_db, init_db
from models import Room, Player
from contextlib import asynccontextmanager
from fastapi import Header
import time
from fastapi import FastAPI, HTTPException, BackgroundTasks
from typing import Dict, List
from pydantic import BaseModel

# start back end server with: uvicorn main:app --reload

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


class JoinRoomRequest(BaseModel):
    username: str
    client_id: str

@app.post("/join_room_with_username/{room_id}")
def join_room_with_username(
    room_id: int,
    data: JoinRoomRequest,
    response: Response,
    db: Session = Depends(get_db),
):
    # Add user to DB if not exists
    player = db.query(Player).filter_by(user_id=data.client_id, room_id=room_id).first()
    if player:
        player.username = data.username
    else:
        player = Player(user_id=data.client_id, username=data.username, room_id=room_id)
        db.add(player)
    db.commit()

    # Set signed session cookie like the old endpoint
    cookie_value = signer.sign(str(room_id)).decode()
    response.set_cookie(
        key="room_session",
        value=cookie_value,
        httponly=True,
        samesite="lax",
        secure=False,  # Set to True in production with HTTPS
    )

    return {"message": f"User '{data.username}' joined room {room_id}"}


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
async def start_game(room_id: int, x_client_id: str = Header(None), db: Session = Depends(get_db)):
    room = db.query(Room).filter(Room.id == room_id).first()
    print(f"[DEBUG] room_id: {room_id}")
    print(f"[DEBUG] x_client_id header: {x_client_id}")
    print(f"[DEBUG] room.creator in DB: {room.creator}")
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    if room.creator != x_client_id:
        raise HTTPException(status_code=403, detail="Only the creator can start the game")

    players = db.query(Player).filter(Player.room_id == room_id).all()
    player_names = [p.username for p in players]

    start_voting_game(room_id, player_names)
    return {"status": "game started", "room_id": room_id}

@app.get("/room_status/{room_id}")
async def room_status(room_id: int):
    status = rooms_status.get(room_id, "waiting")
    return {"room_id": room_id, "status": status}



# Store game state in memory
games = {}  # room_id -> game info

class VoteRequest(BaseModel):
    voter_id: str
    vote_for: str  # player name/id

def start_voting_game(room_id: int, players: List[str]):
    games[room_id] = {
        "question": "Who is the kindest person in the room?",
        "players": players,
        "votes": {},  # voter_id -> voted_player
        "start_time": time.time(),
        "duration": 30,  # seconds
        "finished": False,
    }



@app.get("/game_status/{room_id}")
async def game_status(room_id: int):
    game = games.get(room_id)
    if not game:
        return {"status": "waiting"}

    elapsed = time.time() - game["start_time"]
    remaining = max(0, int(game["duration"] - elapsed))

    if remaining == 0 and not game["finished"]:
        game["finished"] = True

    if not game["finished"]:
        return {
            "status": "voting",
            "question": game["question"],
            "players": game["players"],
            "remaining": remaining,
            "votes_count": {p: list(game["votes"].values()).count(p) for p in game["players"]}
        }
    else:
        # Calculate winner
        votes_count = {p: list(game["votes"].values()).count(p) for p in game["players"]}
        max_votes = max(votes_count.values(), default=0)
        winners = [p for p, c in votes_count.items() if c == max_votes]
        return {
            "status": "finished",
            "winners": winners,
            "votes_count": votes_count
        }

@app.post("/vote/{room_id}")
async def vote(room_id: int, vote: VoteRequest):
    game = games.get(room_id)
    if not game or game["finished"]:
        raise HTTPException(status_code=400, detail="No active voting or voting finished")

    if vote.vote_for not in game["players"]:
        raise HTTPException(status_code=400, detail="Invalid player")

    # Register vote
    game["votes"][vote.voter_id] = vote.vote_for
    return {"message": f"Voted for {vote.vote_for}"}

