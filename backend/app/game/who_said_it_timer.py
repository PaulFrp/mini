"""
Background timer for Who Said It game using DB-backed WhoSaidItGameState.
Handles phase transitions and broadcasts updates.
"""
import asyncio
import time
import logging
import json
from ..db import SessionLocal
from ..models import WhoSaidItGameState
from .websockets import manager

logger = logging.getLogger(__name__)

_active_who_said_it_timers = {}

async def who_said_it_timer_loop(room_id: int):
    logger.info(f"[WHO_SAID_IT_TIMER] Starting timer for room {room_id}")
    try:
        while True:
            with SessionLocal() as db:
                game_state = db.query(WhoSaidItGameState).filter_by(room_id=room_id).first()
                if not game_state:
                    logger.info(f"[WHO_SAID_IT_TIMER] No state for room {room_id}, stopping")
                    break

                now = time.time()
                elapsed = now - game_state.start_time
                remaining = int(game_state.duration - elapsed)

                players = json.loads(game_state.players)
                votes = json.loads(game_state.votes)

                if game_state.phase == "voting":
                    # Check if all players voted or time ran out
                    all_voted = all(p in votes for p in players)

                    if all_voted or remaining <= 0:
                        logger.info(f"[WHO_SAID_IT_TIMER] Room {room_id}: voting -> results")
                        game_state.phase = "results"
                        game_state.start_time = now
                        game_state.duration = 10  # 10 seconds to view results
                        db.commit()

                        # Count votes
                        vote_counts = {}
                        for choice in votes.values():
                            vote_counts[choice] = vote_counts.get(choice, 0) + 1

                        current_quote = json.loads(game_state.current_quote) if game_state.current_quote else {}
                        scores = json.loads(game_state.scores)

                        await manager.broadcast(room_id, {
                            "type": "game_update",
                            "status": "results",
                            "votes": vote_counts,
                            "correct_answer": current_quote.get("correct_answer"),
                            "remaining": game_state.duration,
                            "current_quote": current_quote,
                            "scores": scores,
                            "current_round": game_state.current_round,
                            "total_rounds": game_state.total_rounds,
                        })

                elif game_state.phase == "results":
                    # Results phase doesn't auto-advance; creator must trigger next round
                    # Just keep timer alive for now
                    pass

            await asyncio.sleep(1)
    except asyncio.CancelledError:
        logger.info(f"[WHO_SAID_IT_TIMER] Timer cancelled for room {room_id}")
        raise
    except Exception as e:
        logger.error(f"[WHO_SAID_IT_TIMER] Error in room {room_id}: {e}", exc_info=True)
    finally:
        logger.info(f"[WHO_SAID_IT_TIMER] Timer stopped for room {room_id}")
        if room_id in _active_who_said_it_timers:
            del _active_who_said_it_timers[room_id]


def start_who_said_it_timer(room_id: int):
    if room_id in _active_who_said_it_timers:
        logger.warning(f"[WHO_SAID_IT_TIMER] Already running for {room_id}")
        return
    task = asyncio.create_task(who_said_it_timer_loop(room_id))
    _active_who_said_it_timers[room_id] = task
    logger.info(f"[WHO_SAID_IT_TIMER] Started for room {room_id}")


def stop_who_said_it_timer(room_id: int):
    if room_id in _active_who_said_it_timers:
        task = _active_who_said_it_timers[room_id]
        task.cancel()
        del _active_who_said_it_timers[room_id]
        logger.info(f"[WHO_SAID_IT_TIMER] Stopped for room {room_id}")
