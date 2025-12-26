import time, json, random, os
from ..models import Player, Room, VotingGameState
from datetime import datetime, timezone
from ..db import SessionLocal

BACKEND_DIR = os.path.join(os.path.dirname(__file__), "..", "..")
with open(os.path.join(BACKEND_DIR, "questions.json"), encoding="utf-8") as f:
    QUESTION_POOL = json.load(f)

def start_voting_game(room_id: int, players: list[str]):
    questions = QUESTION_POOL.copy()
    random.shuffle(questions)
    current_question = questions.pop()
    
    with SessionLocal() as db:
        # Remove any existing game state for this room
        existing = db.query(VotingGameState).filter_by(room_id=room_id).first()
        if existing:
            db.delete(existing)
        
        # Create new game state
        game_state = VotingGameState(
            room_id=room_id,
            players=json.dumps(players),
            questions=json.dumps(questions),
            current_question=current_question,
            votes=json.dumps({}),
            start_time=time.time(),
            duration=20,
            finished=False
        )
        db.add(game_state)
        db.commit()
    
    print(f"[VOTING] Started game for room {room_id} with players: {players}")

def game_status_logic(room_id, request, db):
    client_id = request.headers.get("x-client-id")
    player = db.query(Player).filter_by(user_id=client_id, room_id=room_id).first()
    room = db.query(Room).filter_by(id=room_id).first()
    room_creator = room.creator if room else None
    if player:
        player.last_seen = datetime.now(timezone.utc)
        db.commit()

    game_state = db.query(VotingGameState).filter_by(room_id=room_id).first()
    if not game_state:
        print(f"[VOTING] No game found for room {room_id}")
        return {"status": "no_game"}

    now = time.time()
    elapsed = now - game_state.start_time
    
    if not game_state.finished and elapsed < game_state.duration:
        remaining = game_state.duration - elapsed
        votes = json.loads(game_state.votes)
        players = json.loads(game_state.players)
        print(f"[VOTING] Room {room_id}: voting in progress, {remaining:.1f}s remaining")
        return {
            "status": "voting",
            "question": game_state.current_question,
            "players": players,
            "votes_count": len(votes),
            "voters": list(votes.keys()),
            "remaining": int(remaining)
        }

    if not game_state.finished:
        votes = json.loads(game_state.votes)
        vote_counts = {}
        for v in votes.values():
            vote_counts[v] = vote_counts.get(v, 0) + 1
        max_votes = max(vote_counts.values(), default=0)
        winners = [p for p, c in vote_counts.items() if c == max_votes]
        
        game_state.finished = True
        game_state.winners = json.dumps(winners)
        game_state.vote_counts = json.dumps(vote_counts)
        db.commit()
        print(f"[VOTING] Room {room_id}: marking game as finished")

    questions = json.loads(game_state.questions)
    winners = json.loads(game_state.winners) if game_state.winners else []
    vote_counts = json.loads(game_state.vote_counts) if game_state.vote_counts else {}
    
    print(f"[VOTING] Room {room_id}: game finished, showing results")
    return {
        "status": "finished",
        "winners": winners,
        "vote_counts": vote_counts,
        "can_proceed": player and client_id == room_creator,
        "has_next_question": len(questions) > 0,
    }

def next_question_logic(room_id, request, db):
    client_id = request.headers.get("x-client-id")
    player = db.query(Player).filter_by(user_id=client_id, room_id=room_id).first()
    
    game_state = db.query(VotingGameState).filter_by(room_id=room_id).first()
    if not game_state or not game_state.finished:
        return {"status": "cannot_advance"}
    
    questions = json.loads(game_state.questions)
    if questions:
        question = questions.pop()
        game_state.questions = json.dumps(questions)
        game_state.current_question = question
        game_state.votes = json.dumps({})
        game_state.start_time = time.time()
        game_state.finished = False
        game_state.winners = None
        game_state.vote_counts = None
        db.commit()
        return {"status": "voting", "question": question}
    
    # Clean up the game state when game is over - no more questions
    db.delete(game_state)
    db.commit()
    return {"status": "game_over", "message": "No more questions"}
