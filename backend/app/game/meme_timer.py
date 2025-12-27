"""
Centralized meme game timer manager to prevent desync issues.
Handles phase transitions in the background instead of during individual player status requests.
"""
import asyncio
import time
import logging
import json
from .websockets import manager
from ..db import SessionLocal
from ..models import MemeGameState

logger = logging.getLogger(__name__)

# Active meme game timers
_active_meme_timers = {}

async def meme_timer_loop(room_id: int):
    """
    Background task that monitors meme game state and triggers phase transitions.
    This runs independently of player requests to ensure all players see the same state.
    """
    logger.info(f"[MEME_TIMER] Starting meme game timer for room {room_id}")
    
    try:
        while True:
            with SessionLocal() as db:
                game_state = db.query(MemeGameState).filter_by(room_id=room_id).first()
                
                if not game_state:
                    logger.info(f"[MEME_TIMER] No game state found for room {room_id}, stopping timer")
                    break
                
                now = time.time()
                elapsed = now - game_state.start_time
                remaining = int(game_state.duration - elapsed)
                
                # Check for phase transitions
                if game_state.phase == "captioning":
                    # Get players and submissions to check if all submitted
                    players = json.loads(game_state.players)
                    submissions_dict = json.loads(game_state.submissions)
                    all_submitted = len(submissions_dict) >= len(players)
                    
                    if (all_submitted or remaining <= 0):
                        if all_submitted:
                            logger.info(f"[MEME_TIMER] Room {room_id}: All captions submitted, transitioning to 'voting'")
                        else:
                            logger.info(f"[MEME_TIMER] Room {room_id}: Timer expired, transitioning from 'captioning' to 'voting'")
                        game_state.phase = "voting"
                        game_state.start_time = now
                        game_state.duration = 60
                        db.commit()
                        
                        # Prepare submissions for voting
                        submissions = [
                            {
                                "user_id": player_id,
                                "meme": sub["meme"],
                                "captions": sub["captions"],
                                "username": player_id  # Will be resolved on client side
                            }
                            for player_id, sub in submissions_dict.items()
                        ]
                        
                        # Broadcast to all players
                        await manager.broadcast(room_id, {
                            "type": "game_update",
                            "status": "voting",
                            "submissions": submissions,
                            "remaining": game_state.duration,
                        })
                    
                elif game_state.phase == "voting" and remaining <= 0:
                    logger.info(f"[MEME_TIMER] Room {room_id}: Transitioning from 'voting' to 'results'")
                    game_state.phase = "results"
                    
                    # Calculate winners based on points
                    points = json.loads(game_state.points)
                    votes = json.loads(game_state.votes)
                    vote_counts = {}
                    for voted_for in votes.values():
                        vote_counts[voted_for] = vote_counts.get(voted_for, 0) + 1
                    
                    winners = []
                    if points:
                        max_points = max(points.values(), default=0)
                        winners = [p for p, pts in points.items() if pts == max_points]
                    else:
                        # Fallback to vote count
                        max_votes = max(vote_counts.values(), default=0)
                        winners = [p for p, c in vote_counts.items() if c == max_votes]
                    
                    db.commit()
                    
                    # Broadcast results
                    await manager.broadcast(room_id, {
                        "type": "game_update",
                        "status": "results",
                        "winners": winners,
                        "votes": votes,
                        "player_points": points,
                        "vote_counts": vote_counts
                    })
            
            # Sleep for 1 second before next check
            await asyncio.sleep(1)
            
    except asyncio.CancelledError:
        logger.info(f"[MEME_TIMER] Meme game timer cancelled for room {room_id}")
        raise
    except Exception as e:
        logger.error(f"[MEME_TIMER] Error in meme game timer for room {room_id}: {e}", exc_info=True)
    finally:
        logger.info(f"[MEME_TIMER] Meme game timer stopped for room {room_id}")
        if room_id in _active_meme_timers:
            del _active_meme_timers[room_id]

def start_meme_timer(room_id: int):
    """Start a background timer task for a meme game room"""
    if room_id in _active_meme_timers:
        logger.warning(f"[MEME_TIMER] Timer already running for room {room_id}")
        return
    
    task = asyncio.create_task(meme_timer_loop(room_id))
    _active_meme_timers[room_id] = task
    logger.info(f"[MEME_TIMER] Started timer task for room {room_id}")

def stop_meme_timer(room_id: int):
    """Stop the background timer task for a meme game room"""
    if room_id in _active_meme_timers:
        task = _active_meme_timers[room_id]
        task.cancel()
        del _active_meme_timers[room_id]
        logger.info(f"[MEME_TIMER] Stopped timer task for room {room_id}")

def get_active_meme_timers():
    """Get list of room IDs with active meme timers (for debugging)"""
    return list(_active_meme_timers.keys())
