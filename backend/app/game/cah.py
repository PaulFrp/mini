import json, random, time, os
from ..models import Player, Room, CAHGameState
from datetime import datetime, timezone
from .websockets import manager
from .cah_timer import start_cah_timer
from ..db import SessionLocal
import asyncio
import logging

# Load cards and questions
BACKEND_DIR = os.path.join(os.path.dirname(__file__), "..", "..")
with open(os.path.join(BACKEND_DIR, "cah_cards.json"), encoding="utf-8") as f:
    CARD_POOL = json.load(f)

with open(os.path.join(BACKEND_DIR, "cah_questions.json"), encoding="utf-8") as f:
    QUESTION_POOL = json.load(f)

def start_cah_game(room_id: int, players: list[str], creator_id: str):
    """Initialize a new Cards Against Humanity game and persist in DB"""
    # Shuffle question pool
    question_pool = QUESTION_POOL.copy()
    random.shuffle(question_pool)

    # Deal cards to each player (7 cards to start)
    player_hands = {}
    card_pool = CARD_POOL.copy()
    random.shuffle(card_pool)

    for player in players:
        player_hands[player] = []
        for _ in range(7):
            if card_pool:
                player_hands[player].append(card_pool.pop())

    current_question = question_pool.pop() if question_pool else None

    with SessionLocal() as db:
        # Remove existing state for room
        existing = db.query(CAHGameState).filter_by(room_id=room_id).first()
        if existing:
            db.delete(existing)
            db.commit()

        game_state = CAHGameState(
            room_id=room_id,
            players=json.dumps(players),
            creator=creator_id,
            question_pool=json.dumps(question_pool),
            card_pool=json.dumps(card_pool),
            current_question=json.dumps(current_question) if current_question else json.dumps({}),
            player_hands=json.dumps(player_hands),
            submissions=json.dumps({}),
            votes=json.dumps({}),
            phase="playing",
            start_time=time.time(),
            duration=60,
            scores=json.dumps({p: 0 for p in players}),
            round=1,
            card_czar=players[0] if players else None,
            czar_index=0,
        )
        db.add(game_state)
        db.commit()
    # Start background timer to handle phase transitions
    start_cah_timer(room_id)

async def get_game_status_logic(room_id, client_id, db):
    """Get current game status for a player (NO PHASE TRANSITIONS - handled by timer)"""
    db.expire_all()
    player = db.query(Player).filter_by(user_id=client_id, room_id=room_id).first()
    room = db.query(Room).filter_by(id=room_id).first()
    room_creator = room.creator if room else None

    if player:
        player.last_seen = datetime.now(timezone.utc)
        db.commit()

    game_state = db.query(CAHGameState).filter_by(room_id=room_id).first()
    if not game_state:
        return {"status": "no_game"}

    now = time.time()
    remaining = int(game_state.duration - (now - game_state.start_time))
    
    # Get player's username
    player_username = player.username if player else client_id
    
    # Prepare response based on phase
    # Parse JSON fields
    current_question = json.loads(game_state.current_question) if game_state.current_question else {}
    scores = json.loads(game_state.scores)
    player_hands = json.loads(game_state.player_hands)
    submissions = json.loads(game_state.submissions)
    votes = json.loads(game_state.votes)

    response = {
        "status": game_state.phase,
        "remaining": max(0, remaining),
        "current_question": current_question,
        "scores": scores,
        "round": game_state.round,
        "card_czar": game_state.card_czar,
        "is_czar": player_username == game_state.card_czar,
        "player_hand": player_hands.get(player_username, []),
        "has_submitted": player_username in submissions
    }
    
    # Add phase-specific data
    if game_state.phase == "voting":
        # Resolve usernames for submissions
        players_in_room = db.query(Player).filter_by(room_id=room_id).all()
        player_id_to_username = {p.user_id: p.username for p in players_in_room}
        
        # Shuffle submissions to anonymize
        submission_list = [
            {
                "player": player_name,
                "cards": cards,
                "username": player_name  # Already using username
            }
            for player_name, cards in submissions.items()
            if player_name != game_state.card_czar  # Don't show czar's submission if any
        ]
        random.shuffle(submission_list)
        
        response["submissions"] = submission_list
        response["has_voted"] = player_username in votes
        
    elif game_state.phase == "results":
        # Count votes
        vote_counts = {}
        for voted_for in votes.values():
            vote_counts[voted_for] = vote_counts.get(voted_for, 0) + 1
        
        # Find winner of round
        round_winner = None
        if vote_counts:
            max_votes = max(vote_counts.values())
            winners = [p for p, v in vote_counts.items() if v == max_votes]
            round_winner = winners[0] if len(winners) == 1 else None
        
        response["vote_counts"] = vote_counts
        response["round_winner"] = round_winner
        response["submissions"] = [
            {
                "player": player_name,
                "cards": cards,
                "votes": vote_counts.get(player_name, 0)
            }
            for player_name, cards in submissions.items()
            if player_name != game_state.card_czar
        ]
    
    # NOTE: Phase transitions are handled by the background game_timer, not here
    # This prevents race conditions where different players see different states
    
    return response

async def submit_cards_logic(room_id, client_id, selected_cards, db):
    """Handle a player submitting their cards"""
    db.expire_all()
    player = db.query(Player).filter_by(user_id=client_id, room_id=room_id).first()
    if not player:
        return {"error": "Player not found"}
    
    game_state = db.query(CAHGameState).filter_by(room_id=room_id).first()
    if not game_state or game_state.phase != "playing":
        return {"error": "Cannot submit cards now"}
    
    player_username = player.username
    
    # Don't allow card czar to submit
    if player_username == game_state.card_czar:
        return {"error": "Card Czar cannot submit cards"}
    
    # Check if player already submitted
    submissions = json.loads(game_state.submissions)
    if player_username in submissions:
        return {"error": "You already submitted your cards"}
    
    # Validate cards are in player's hand
    player_hands = json.loads(game_state.player_hands)
    player_hand = player_hands.get(player_username, [])
    for card in selected_cards:
        if card not in player_hand:
            return {"error": "Invalid card selection"}
    
    # Validate number of cards matches question blanks
    current_question = json.loads(game_state.current_question)
    required_cards = current_question.get("blanks", 1)
    if len(selected_cards) != required_cards:
        return {"error": f"Must submit exactly {required_cards} card(s)"}
    
    # Remove cards from hand
    for card in selected_cards:
        player_hand.remove(card)
    
    # Refill hand to 7 cards
    card_pool = json.loads(game_state.card_pool)
    while len(player_hand) < 7 and card_pool:
        player_hand.append(card_pool.pop())

    submissions[player_username] = selected_cards

    # Persist
    player_hands[player_username] = player_hand
    game_state.player_hands = json.dumps(player_hands)
    game_state.card_pool = json.dumps(card_pool)
    game_state.submissions = json.dumps(submissions)
    db.commit()
    
    # Send individual status updates to each player (don't broadcast full status which includes hands)
    # Just notify that a player submitted
    await manager.broadcast(room_id, {
        "type": "player_submitted",
        "player": player_username,
        "total_submissions": len(submissions),
    })
    
    return {"success": True}

async def submit_vote_logic(room_id, client_id, voted_for, db):
    """Handle card czar voting for winner"""
    db.expire_all()
    player = db.query(Player).filter_by(user_id=client_id, room_id=room_id).first()
    if not player:
        return {"error": "Player not found"}
    
    game_state = db.query(CAHGameState).filter_by(room_id=room_id).first()
    if not game_state or game_state.phase != "voting":
        return {"error": "Cannot vote now"}
    
    player_username = player.username
    
    # Only card czar can vote
    if player_username != game_state.card_czar:
        return {"error": "Only Card Czar can vote"}
    
    # Validate voted_for is in submissions
    submissions = json.loads(game_state.submissions)
    votes = json.loads(game_state.votes)
    if player_username in votes:
        return {"error": "Already voted"}

    if voted_for not in submissions:
        return {"error": "Invalid vote"}
    
    votes[player_username] = voted_for
    game_state.votes = json.dumps(votes)
    db.commit()
    
    return {"success": True}


async def transition_to_results_after_vote(room_id: int, db):
    """Move to results phase after czar vote and broadcast to all players."""
    db.expire_all()
    game_state = db.query(CAHGameState).filter_by(room_id=room_id).first()
    if not game_state:
        return {"error": "Game not found"}

    game_state.phase = "results"
    votes = json.loads(game_state.votes)
    vote_counts = {}
    for voted_player in votes.values():
        vote_counts[voted_player] = vote_counts.get(voted_player, 0) + 1

    scores = json.loads(game_state.scores)
    round_winner = None
    if vote_counts:
        max_votes = max(vote_counts.values())
        winners = [p for p, v in vote_counts.items() if v == max_votes]
        if len(winners) == 1:
            scores[winners[0]] = scores.get(winners[0], 0) + 1
            round_winner = winners[0]

    game_state.scores = json.dumps(scores)
    db.commit()

    submissions = json.loads(game_state.submissions)
    payload = {
        "type": "game_update",
        "status": "results",
        "round_winner": round_winner,
        "scores": scores,
        "vote_counts": vote_counts,
        "submissions": [
            {
                "player": player_name,
                "cards": cards,
                "votes": vote_counts.get(player_name, 0),
            }
            for player_name, cards in submissions.items()
            if player_name != game_state.card_czar
        ],
    }
    await manager.broadcast(room_id, payload)
    return {"success": True, **payload}

async def next_round_logic(room_id, db):
    """Start the next round"""
    game_state = db.query(CAHGameState).filter_by(room_id=room_id).first()
    if not game_state or game_state.phase != "results":
        return {"error": "Cannot start next round"}
    
    # Check if game should end (first to 5 points wins)
    scores = json.loads(game_state.scores)
    max_score = max(scores.values()) if scores else 0
    if max_score >= 5:
        winners = [p for p, s in scores.items() if s == max_score]
        # Stop the timer when game ends
        # No separate timer; end game immediately
        await manager.broadcast(room_id, {
            "type": "game_over",
            "winners": winners,
            "final_scores": scores
        })
        return {"game_over": True, "winners": winners}
    
    # Rotate card czar
    players = json.loads(game_state.players)
    game_state.czar_index = (game_state.czar_index + 1) % len(players)
    game_state.card_czar = players[game_state.czar_index]
    
    # Get next question
    question_pool = json.loads(game_state.question_pool)
    if not question_pool:
        question_pool = QUESTION_POOL.copy()
        random.shuffle(question_pool)

    current_question = question_pool.pop()
    game_state.question_pool = json.dumps(question_pool)
    game_state.current_question = json.dumps(current_question)
    game_state.submissions = json.dumps({})
    game_state.votes = json.dumps({})
    game_state.phase = "playing"
    game_state.start_time = time.time()
    game_state.duration = 60
    game_state.round = (game_state.round or 0) + 1
    db.commit()
    
    # Broadcast new round
    await manager.broadcast(room_id, {
        "type": "game_update",
        "status": "playing",
        "current_question": current_question,
        "card_czar": game_state.card_czar,
        "round": game_state.round,
        "scores": scores,
        "remaining": game_state.duration
    })
    
    return {"success": True}
