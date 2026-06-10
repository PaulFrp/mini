from fastapi import APIRouter, Depends, Request, Header, HTTPException
from ..db import get_db
from ..schemas import VoteRequest
from ..models import Player, Room, VotingGameState
from ..game.voting import (
    start_voting_game,
    game_status_logic,
    next_question_logic,
    try_finish_voting_early,
)
import json

import time
from datetime import datetime, timezone

router = APIRouter()

@router.post("/start_game/{room_id}")
async def start_game(room_id: int, x_client_id: str = Header(None), db=Depends(get_db)):
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room or room.creator != x_client_id:
        raise HTTPException(status_code=403, detail="Not allowed")
    players = db.query(Player).filter(Player.room_id == room_id).all()
    start_voting_game(room_id, [p.username for p in players])
    return {"status": "game started"}

@router.get("/game_status/{room_id}")
def game_status(room_id: int, request: Request, db=Depends(get_db)):
    return game_status_logic(room_id, request, db)

@router.post("/next_question/{room_id}")
def next_question(room_id: int, request: Request, db=Depends(get_db)):
    return next_question_logic(room_id, request, db)

@router.post("/vote/{room_id}")
def vote(room_id: int, vote: VoteRequest, db=Depends(get_db)):
    game_state = db.query(VotingGameState).filter_by(room_id=room_id).first()
    print(f"[VOTING] Vote received for room {room_id}, game_state exists: {game_state is not None}")
    
    if not game_state or game_state.finished:
        print(f"[VOTING] Game not active or finished for room {room_id}")
        raise HTTPException(status_code=400, detail="Voting is not active")
    
    votes = json.loads(game_state.votes)
    votes[vote.voter_id] = vote.vote_for
    game_state.votes = json.dumps(votes)
    db.commit()

    all_voted = try_finish_voting_early(game_state, db)

    print(f"[VOTING] Vote registered for room {room_id}, now {len(votes)} votes")
    return {
        "message": "Vote registered",
        "all_voted": all_voted,
    }
