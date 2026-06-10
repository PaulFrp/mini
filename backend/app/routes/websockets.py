# app/routes/ws.py

import json
import asyncio
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from ..game.websockets import manager
from ..db import get_db, SessionLocal
from ..models import Player, Room, MemeGameState, WhoSaidItGameState
from ..game.meme import get_game_status_logic, next_meme_logic, MEME_POOL
from ..game.meme_timer import (
    ABSTAIN,
    try_advance_from_captioning,
    try_advance_from_voting,
)
from ..game import cah
from ..game import who_said_it

router = APIRouter()

@router.websocket("/ws/{room_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: int):
    client_id = websocket.query_params.get("client_id")
    print(f"[WS] Client {client_id} connecting to room {room_id}")
    await manager.connect(room_id, websocket)
    print(f"[WS] Client {client_id} connected. Active connections: {len(manager.active_connections.get(room_id, []))}")

    # Keepalive task to prevent Heroku timeout (55s)
    async def send_keepalive():
        try:
            while True:
                await asyncio.sleep(20)  # Send ping every 20 seconds
                try:
                    await websocket.send_json({"type": "ping"})
                    print(f"[MEME_WS] Sent keepalive ping to {client_id}")
                except Exception as e:
                    print(f"[MEME_WS] Keepalive failed for {client_id}: {e}")
                    break
        except asyncio.CancelledError:
            pass

    keepalive_task = asyncio.create_task(send_keepalive())

    try:
        with SessionLocal() as db:
            try:
                status = await get_game_status_logic(room_id, client_id, db)
                await websocket.send_json({"type": "game_update", **status})
                print(f"[MEME_WS] Sent initial status to client {client_id}: {status.get('status', 'unknown')}")
            except Exception as e:
                print(f"[MEME_WS] Failed to fetch initial status for client {client_id}: {e}")
                await websocket.send_json({"type": "game_update", "status": "no_game"})

        while True:
            data = await websocket.receive_text()
            message = json.loads(data)

            msg_type = message.get("type")

            if msg_type == "pong":
                continue

            with SessionLocal() as db:
                if msg_type == "get_status":
                    status = await get_game_status_logic(room_id, client_id, db)
                    await websocket.send_json({"type": "game_update", **status})

                elif msg_type == "submit_caption":
                    captions = message.get("caption") or []

                    game_state = db.query(MemeGameState).filter_by(room_id=room_id).first()
                    if not game_state or game_state.phase != "captioning":
                        await websocket.send_json({"error": "Not in captioning phase"})
                        continue

                    current_meme = json.loads(game_state.current_meme)
                    expected_slots = len(current_meme.get("caption_slots", []))
                    if expected_slots and len(captions) != expected_slots:
                        await websocket.send_json({"error": "Invalid caption count"})
                        continue

                    captions_dict = json.loads(game_state.captions)
                    submissions_dict = json.loads(game_state.submissions)

                    captions_dict[client_id] = captions
                    submissions_dict[client_id] = {
                        "meme": current_meme,
                        "captions": captions,
                    }

                    game_state.captions = json.dumps(captions_dict)
                    game_state.submissions = json.dumps(submissions_dict)
                    db.commit()

                    advanced = await try_advance_from_captioning(room_id, db)
                    if not advanced:
                        status = await get_game_status_logic(room_id, client_id, db)
                        await manager.broadcast(room_id, {
                            "type": "game_update",
                            **status
                        })

                elif msg_type == "submit_vote":
                    vote_for = message.get("vote_for")
                    try:
                        points_awarded = int(message.get("points") or 0)
                    except (ValueError, TypeError):
                        points_awarded = 0

                    game_state = db.query(MemeGameState).filter_by(room_id=room_id).first()
                    if not game_state or game_state.phase != "voting":
                        await websocket.send_json({"error": "Voting is not active"})
                        continue

                    votes_dict = json.loads(game_state.votes)
                    submissions_dict = json.loads(game_state.submissions)
                    points_dict = json.loads(game_state.points)

                    if client_id in votes_dict and votes_dict[client_id] != ABSTAIN:
                        await websocket.send_json({"error": "You already voted"})
                        continue

                    if not vote_for or vote_for not in submissions_dict:
                        await websocket.send_json({"error": "Invalid vote target"})
                        continue

                    if client_id == vote_for:
                        await websocket.send_json({"error": "You can't vote for yourself!"})
                        continue

                    votes_dict[client_id] = vote_for
                    points_dict[vote_for] = points_dict.get(vote_for, 0) + points_awarded

                    game_state.votes = json.dumps(votes_dict)
                    game_state.points = json.dumps(points_dict)
                    db.commit()

                    advanced = await try_advance_from_voting(room_id, db)
                    if not advanced:
                        status = await get_game_status_logic(room_id, client_id, db)
                        await manager.broadcast(room_id, {
                            "type": "game_update",
                            **status
                        })

                elif msg_type == "skip_vote":
                    game_state = db.query(MemeGameState).filter_by(room_id=room_id).first()
                    if not game_state or game_state.phase != "voting":
                        await websocket.send_json({"error": "Voting is not active"})
                        continue

                    votes_dict = json.loads(game_state.votes)
                    if client_id in votes_dict and votes_dict[client_id] != ABSTAIN:
                        await websocket.send_json({"error": "You already voted"})
                        continue

                    votes_dict[client_id] = ABSTAIN
                    game_state.votes = json.dumps(votes_dict)
                    db.commit()

                    advanced = await try_advance_from_voting(room_id, db)
                    if not advanced:
                        status = await get_game_status_logic(room_id, client_id, db)
                        await manager.broadcast(room_id, {
                            "type": "game_update",
                            **status
                        })

                elif msg_type == "next_meme":
                    room = db.query(Room).filter(Room.id == room_id).first()
                    if not room or room.creator != client_id:
                        await websocket.send_json({"error": "Only creator can trigger next meme"})
                        continue

                    result = next_meme_logic(room_id, client_id, db)

                    if result["status"] == "next_meme":
                        print("[WS] Next meme triggered. Broadcasting...")
                        status = await get_game_status_logic(room_id, client_id, db)
                        await manager.broadcast(room_id, {
                            "type": "game_update",
                            **status
                        })

                    elif result["status"] == "game_over":
                        print("[WS] No more memes. Game over.")
                        await manager.broadcast(room_id, {
                            "type": "game_over"
                        })

                    elif result["status"] == "cannot_advance":
                        await websocket.send_json({"error": "Can't proceed yet."})

                    elif result["status"] == "unauthorized":
                        await websocket.send_json({"error": "Unauthorized to trigger next meme."})

                else:
                    await websocket.send_json({"error": "Unknown message type"})

    except WebSocketDisconnect:
        print(f"[WS] Client {client_id} disconnected from room {room_id}")
        keepalive_task.cancel()
        manager.disconnect(room_id, websocket)
    except Exception as e:
        print(f"[WS] Error for client {client_id} in room {room_id}: {e}")
        keepalive_task.cancel()
        manager.disconnect(room_id, websocket)


@router.websocket("/ws/who_said_it/{room_id}")
async def who_said_it_websocket_endpoint(websocket: WebSocket, room_id: int):
    """WebSocket endpoint for Who Said It game"""
    client_id = websocket.query_params.get("client_id")
    print(f"[WHO_SAID_IT_WS] Client {client_id} connecting to room {room_id}")
    await manager.connect(room_id, websocket)
    print(f"[WHO_SAID_IT_WS] Client {client_id} connected. Active connections: {len(manager.active_connections.get(room_id, []))}")

    # Keepalive task to prevent Heroku timeout
    async def send_keepalive():
        try:
            while True:
                await asyncio.sleep(20)
                try:
                    await websocket.send_json({"type": "ping"})
                    print(f"[WHO_SAID_IT_WS] Sent keepalive ping to {client_id}")
                except Exception as e:
                    print(f"[WHO_SAID_IT_WS] Keepalive failed for {client_id}: {e}")
                    break
        except asyncio.CancelledError:
            pass

    keepalive_task = asyncio.create_task(send_keepalive())

    try:
        db = next(get_db())

        # Push initial status on connect
        try:
            status = await who_said_it.get_game_status_logic(room_id, client_id, db)
            await websocket.send_json({"type": "game_update", **status})
            print(f"[WHO_SAID_IT_WS] Sent initial status to client {client_id}: {status.get('status', 'unknown')}")
        except Exception as e:
            print(f"[WHO_SAID_IT_WS] Failed to fetch initial status for client {client_id}: {e}")
            await websocket.send_json({"type": "game_update", "status": "no_game"})

        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            msg_type = message.get("type")

            # --- 0. Ping/Pong for keepalive ---
            if msg_type == "pong":
                continue

            # --- 1. Game status sync ---
            if msg_type == "get_status":
                status = await who_said_it.get_game_status_logic(room_id, client_id, db)
                await websocket.send_json({"type": "game_update", **status})

            # --- 2. Submit vote ---
            elif msg_type == "submit_vote":
                choice = message.get("choice")
                result = await who_said_it.submit_vote_logic(room_id, client_id, choice, db)
                
                if "error" in result:
                    await websocket.send_json({"error": result["error"]})
                # Timer will handle transition to results when all votes are in

            # --- 3. Next round ---
            elif msg_type == "next_round":
                room = db.query(Room).filter(Room.id == room_id).first()
                if not room or room.creator != client_id:
                    await websocket.send_json({"error": "Only creator can start next round"})
                    continue

                result = await who_said_it.next_round_logic(room_id, db)
                
                if "error" in result:
                    await websocket.send_json({"error": result["error"]})
                elif result.get("game_over"):
                    game_state = db.query(WhoSaidItGameState).filter_by(room_id=room_id).first()
                    scores = json.loads(game_state.scores) if game_state and game_state.scores else {}
                    await manager.broadcast(room_id, {
                        "type": "game_over",
                        "winners": result["winners"],
                        "final_scores": scores,
                    })

            # --- Unknown message ---
            else:
                await websocket.send_json({"error": "Unknown message type"})

    except WebSocketDisconnect:
        print(f"[WHO_SAID_IT_WS] Client {client_id} disconnected from room {room_id}")
        keepalive_task.cancel()
        manager.disconnect(room_id, websocket)
    except Exception as e:
        print(f"[WHO_SAID_IT_WS] Error for client {client_id} in room {room_id}: {e}")
        keepalive_task.cancel()
        manager.disconnect(room_id, websocket)


@router.websocket("/ws/cah/{room_id}")
async def cah_websocket_endpoint(websocket: WebSocket, room_id: int):
    """WebSocket endpoint for Cards Against Humanity game"""
    client_id = websocket.query_params.get("client_id")
    print(f"[CAH_WS] Client {client_id} connecting to CAH room {room_id}")
    await manager.connect(room_id, websocket)
    print(f"[CAH_WS] Client {client_id} connected. Active connections: {len(manager.active_connections.get(room_id, []))}")

    # Keepalive task to prevent Heroku timeout
    async def send_keepalive():
        try:
            while True:
                await asyncio.sleep(20)  # Send ping every 20 seconds
                try:
                    await websocket.send_json({"type": "ping"})
                    print(f"[CAH_WS] Sent keepalive ping to {client_id}")
                except Exception as e:
                    print(f"[CAH_WS] Keepalive failed for {client_id}: {e}")
                    break
        except asyncio.CancelledError:
            pass

    keepalive_task = asyncio.create_task(send_keepalive())

    try:
        db = next(get_db())

        # Proactively push current status on connect to avoid race conditions on Heroku
        try:
            status = await cah.get_game_status_logic(room_id, client_id, db)
            await websocket.send_json({"type": "game_update", **status})
            print(f"[CAH_WS] Sent initial status to client {client_id}: {status.get('status', 'unknown')}")
        except Exception as e:
            # Don't fail the connection if status fetch hiccups
            print(f"[CAH_WS] Failed to fetch initial status for client {client_id}: {e}")
            await websocket.send_json({"type": "game_update", "status": "no_game"})

        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            msg_type = message.get("type")

            # --- 0. Ping/Pong for keepalive ---
            if msg_type == "pong":
                continue

            # --- 1. Game status sync ---
            if msg_type == "get_status":
                db.expire_all()
                status = await cah.get_game_status_logic(room_id, client_id, db)
                await websocket.send_json({"type": "game_update", **status})

            # --- 2. Submit cards ---
            elif msg_type == "submit_cards":
                db.expire_all()
                selected_cards = message.get("cards", [])
                result = await cah.submit_cards_logic(room_id, client_id, selected_cards, db)
                
                if "error" in result:
                    await websocket.send_json({"error": result["error"]})
                # Don't broadcast full status here - that will update player hands globally
                # The frontend handles hasSubmitted state locally

            # --- 3. Submit vote (Card Czar only) ---
            elif msg_type == "submit_vote":
                db.expire_all()
                voted_for = message.get("voted_for")
                result = await cah.submit_vote_logic(room_id, client_id, voted_for, db)
                
                if "error" in result:
                    await websocket.send_json({"error": result["error"]})
                else:
                    await cah.transition_to_results_after_vote(room_id, db)

            # --- 4. Next round ---
            elif msg_type == "next_round":
                room = db.query(Room).filter(Room.id == room_id).first()
                if not room or room.creator != client_id:
                    await websocket.send_json({"error": "Only creator can start next round"})
                    continue

                result = await cah.next_round_logic(room_id, db)
                
                if "error" in result:
                    await websocket.send_json({"error": result["error"]})
                elif result.get("game_over"):
                    from ..models import CAHGameState
                    game_state = db.query(CAHGameState).filter_by(room_id=room_id).first()
                    scores = json.loads(game_state.scores) if game_state and game_state.scores else {}
                    await manager.broadcast(room_id, {
                        "type": "game_over",
                        "winners": result["winners"],
                        "final_scores": scores,
                    })
                # Otherwise, next_round_logic already broadcasted the new round

            # --- Unknown message ---
            else:
                await websocket.send_json({"error": "Unknown message type"})

    except WebSocketDisconnect:
        print(f"[CAH_WS] Client {client_id} disconnected from CAH room {room_id}")
        keepalive_task.cancel()
        manager.disconnect(room_id, websocket)
    except Exception as e:
        print(f"[CAH_WS] Error for client {client_id} in CAH room {room_id}: {e}")
        keepalive_task.cancel()
        manager.disconnect(room_id, websocket)

