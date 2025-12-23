# Architecture & Data Flow Diagrams

## System Architecture

```
┌────────────────────────────────────────────────────────────┐
│                    MAKE IT MEME GAME                       │
│                   Local Development                        │
└────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                   FRONTEND (Next.js + React)                    │
│                    http://localhost:3000                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ pages/make_it_meme/room.js (Game Client)               │  │
│  │ ✅ WebSocket Connection                                │  │
│  │ ✅ Auto-reconnect Logic                                │  │
│  │ ✅ Phase Management                                    │  │
│  │ ✅ Timer Sync                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ memecanvas.js (Meme Rendering)                         │  │
│  │ - Display meme image                                    │  │
│  │ - Render caption input areas                            │  │
│  │ - Show voting interface                                │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  .env.local:                                                    │
│  - NEXT_PUBLIC_BACKEND_URL=http://localhost:8000               │
│  - NEXT_PUBLIC_WS_BASE_URL=ws://localhost:8000                 │
└──────────────────────────────────────────────────────────────┬──┘
                                │
                   REST + WebSocket
                                │
┌──────────────────────────────────────────────────────────────┴──┐
│                   BACKEND (FastAPI/Python)                      │
│                    http://localhost:8000                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ app/main.py (Server Entry)                             │  │
│  │ - FastAPI app initialization                           │  │
│  │ - CORS configuration                                   │  │
│  │ - Route registration                                   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ routes/ (HTTP Endpoints)                               │  │
│  │ ✅ meme.py    → POST /meme/start_game/{room_id}        │  │
│  │ ✅ meme.py    → GET  /meme/templates                   │  │
│  │   room.py    → Room management                         │  │
│  │   voting.py  → Voting endpoints                        │  │
│  │ ✅ websockets.py → WebSocket: /ws/{room_id}            │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ game/ (Game Logic)                                     │  │
│  │ ✅ meme.py         → Game state & phase logic          │  │
│  │   - start_meme_game()                                  │  │
│  │   - get_game_status_logic()    [FIXED ✅]              │  │
│  │   - next_meme_logic()                                  │  │
│  │ ✅ websockets.py   → Connection manager                │  │
│  │   - Broadcast messages to all players                  │  │
│  │   utils.py, voting.py                                  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ models.py (Database Models)                            │  │
│  │ - Room      (rooms, creator, players)                  │  │
│  │ - Player    (user_id, username, room_id)               │  │
│  │                                                        │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  .env:                                                          │
│  - DATABASE_URL=sqlite:///./test.db                            │
│  - FRONTEND_URLS=http://localhost:3000                         │
└──────────────────────────────────────────────────────────────┬──┘
                                │
                            SQL
                                │
┌──────────────────────────────────────────────────────────────┴──┐
│                   DATABASE (SQLite)                             │
│                  backend/test.db                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Tables:                                                        │
│  - rooms        (id, name, creator, created_at)                │
│  - players      (id, user_id, username, room_id, ...)          │
│  - game_state   (room_id, current_phase, current_meme, ...)    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Game State Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    GAME LIFECYCLE                               │
└─────────────────────────────────────────────────────────────────┘

1. ROOM CREATION
   ├─ Player A creates room
   ├─ Backend creates Room record
   └─ Returns room_id to frontend

2. PLAYER JOINING
   ├─ Player B joins room with room_id
   ├─ Backend creates Player records
   └─ All players can see each other

3. GAME START
   ├─ Player A (creator) clicks "▶️ Start Game"
   ├─ Backend calls start_meme_game(room_id)
   │  ├─ Creates games[room_id] with initial state
   │  ├─ Pops first meme from shuffled meme_pool
   │  ├─ Sets phase = "captioning"
   │  └─ Returns full game status
   ├─ Backend broadcasts to all WebSocket connections
   └─ All clients receive: {status: "captioning", current_meme: {...}, ...}

4. CAPTIONING PHASE (60 seconds)
   ├─ Players see: Meme image + Caption input boxes
   ├─ Each player fills in captions and clicks "✅ Submit"
   ├─ Backend stores: games[room_id]["submissions"][client_id] = {meme, captions}
   │
   ├─ TIMER HITS ZERO:
   │  ├─ Backend detects: remaining <= 0
   │  ├─ Backend calls: get_game_status_logic()
   │  ├─ Switches phase: "captioning" → "voting"
   │  ├─ Broadcasts to all: submissions with usernames ✅
   │  └─ All clients receive: {status: "voting", submissions: [{...}, {...}]}
   │
   └─ Clients update UI → "🗳️ Vote for the caption!"

5. VOTING PHASE (60 seconds)
   ├─ Players see: All submissions one by one
   ├─ Each submission shows: username + meme + captions
   ├─ Players can:
   │  ├─ Click "👍 Upvote (+100)" to vote for that meme
   │  ├─ Click "👎 Downvote (-50)" to vote against
   │  └─ Click "⏭️ Skip" if it's their own meme
   │
   ├─ Backend tracks:
   │  ├─ games[room_id]["votes"][client_id] = voted_player_id
   │  ├─ games[room_id]["player_points"][voted_player_id] += points
   │  └─ Broadcasts updated status to all
   │
   ├─ TIMER HITS ZERO:
   │  ├─ Backend detects: remaining <= 0
   │  ├─ Switches phase: "voting" → "results"
   │  ├─ Calculates winners (most votes received)
   │  ├─ Broadcasts: {status: "results", winners, player_points: {...}} ✅
   │  └─ All clients receive complete results
   │
   └─ Clients update UI → "🏆 Results"

6. RESULTS PHASE
   ├─ Shows: Winners + All captions + Vote counts + Points
   ├─ Creator sees: "➡️ Next Meme" button
   │
   ├─ IF MORE MEMES:
   │  ├─ Creator clicks "➡️ Next Meme"
   │  ├─ Backend calls: next_meme_logic()
   │  │  ├─ Pops next meme from meme_pool
   │  │  ├─ Resets: votes, captions, submissions, votes
   │  │  └─ Sets phase = "captioning" again
   │  ├─ Broadcasts new status
   │  └─ Back to step 4 (CAPTIONING PHASE)
   │
   └─ IF NO MORE MEMES:
      ├─ Backend returns: {status: "game_over"}
      └─ All clients show: Game ended, final scores

┌─────────────────────────────────────────────────────────────────┐
│                   BACKEND DATA STRUCTURE                        │
└─────────────────────────────────────────────────────────────────┘

games = {
  room_id: {
    "players": ["player1_username", "player2_username"],
    "creator": "player1_client_id",
    "phase": "voting",                    ← "captioning" | "voting" | "results"
    
    "current_meme": {
      "id": 1,
      "filename": "meme.jpg",
      "caption_slots": [
        {"x": 10, "y": 20, "width": 100, "height": 50},
        {"x": 10, "y": 250, "width": 100, "height": 50}
      ]
    },
    
    "submissions": {
      "client_id_1": {
        "meme": {...},
        "captions": ["Top caption", "Bottom caption"]
      },
      "client_id_2": {
        "meme": {...},
        "captions": ["Text 1", "Text 2"]
      }
    },
    
    "votes": {
      "client_id_1": "client_id_2",      ← player 1 voted for player 2
      "client_id_2": "client_id_1"       ← player 2 voted for player 1
    },
    
    "player_points": {
      "client_id_1": 100,                ← Earned 100 points (1 upvote)
      "client_id_2": 50                  ← Earned 50 points (1 downvote)
    },
    
    "start_time": 1234567890.123,
    "duration": 60,                       ← Seconds for current phase
    
    "meme_pool": [
      {...meme3...},
      {...meme4...},
      {...meme5...}
    ]                                     ← Remaining memes to play
  }
}
```

---

## WebSocket Message Flow

```
BROWSER (Client A)                         SERVER (Backend)
     │                                          │
     │──────────(WebSocket Connect)─────────────│
     │              /ws/room_1?client_id=abc   │
     │                                          │
     ├──────(JSON: get_status)─────────────────│
     │       {type: "get_status"}               │
     │                                          │
     │◄─────(JSON: game_update)─────────────────┤
     │ {type: "game_update",                    │
     │  status: "captioning",                   │
     │  current_meme: {...},                    │
     │  remaining: 60}                          │
     │                                          │
     │──────(JSON: submit_caption)──────────────│
     │ {type: "submit_caption",                 │
     │  caption: ["Top text", "Bottom text"]}   │
     │                                          │
     │◄─────(BROADCAST to all in room_1)───────┤
     │ {type: "game_update",                    │
     │  status: "captioning",                   │
     │  captions_submitted: 1}                  │
     │                                          │
     │ [60 seconds pass, timer hits 0]          │
     │                                          │
     │◄─────(BROADCAST: Phase change)───────────┤
     │ {type: "game_update",                    │
     │  status: "voting",                       │
     │  submissions: [                          │
     │    {user_id: "abc", username: "Alice",   │
     │     captions: [...], meme: {...}},      │
     │    {user_id: "def", username: "Bob",     │
     │     captions: [...], meme: {...}}       │
     │  ],                                      │
     │  remaining: 60}                          │
     │                                          │
     │──────(JSON: submit_vote)─────────────────│
     │ {type: "submit_vote",                    │
     │  vote_for: "def",                        │
     │  points: 100}                            │
     │                                          │
     │◄─────(BROADCAST to all in room_1)───────┤
     │ {type: "game_update",                    │
     │  status: "voting",                       │
     │  remaining: 45}                          │
     │                                          │
     │ [Timer hits 0]                           │
     │                                          │
     │◄─────(BROADCAST: Phase change)───────────┤
     │ {type: "game_update",                    │
     │  status: "results",                      │
     │  player_points: {"def": 100},            │
     │  winners: ["def"],                       │
     │  votes: {...},                           │
     │  remaining: 0}                           │
     │                                          │
     │ [Creator clicks "Next Meme"]             │
     │                                          │
     │──────(JSON: next_meme)───────────────────│
     │ {type: "next_meme"}                      │
     │                                          │
     │◄─────(BROADCAST back to captioning)─────┤
     │ {type: "game_update",                    │
     │  status: "captioning",                   │
     │  current_meme: {...next_meme...},        │
     │  remaining: 60}                          │
```

---

## Data Flow: Captions to Results

```
┌──────────────────────────────────────────────────────────┐
│                 CAPTION → RESULT FLOW                    │
└──────────────────────────────────────────────────────────┘

PLAYER A (client_id: "aaa")
│
├─ Submits: ["Top caption", "Bottom caption"]
│  └─ Backend stores:
│     games[room_1]["submissions"]["aaa"] = {
│       "meme": {id: 5, filename: "...", caption_slots: [...]},
│       "captions": ["Top caption", "Bottom caption"]
│     }
│     games[room_1]["captions"]["aaa"] = ["Top caption", "Bottom caption"]
│
└─ Votes for PLAYER B with +100 points
   └─ Backend stores:
      games[room_1]["votes"]["aaa"] = "bbb"
      games[room_1]["player_points"]["bbb"] += 100


PLAYER B (client_id: "bbb")
│
├─ Submits: ["Different text", "Another text"]
│  └─ Backend stores:
│     games[room_1]["submissions"]["bbb"] = {...}
│     games[room_1]["captions"]["bbb"] = [...]
│
└─ Votes for PLAYER A with -50 points
   └─ Backend stores:
      games[room_1]["votes"]["bbb"] = "aaa"
      games[room_1]["player_points"]["aaa"] += -50


RESULTS PHASE - Backend Calculates:
│
├─ Player Points:
│  games[room_1]["player_points"] = {
│    "aaa": -50,     ← Got 1 downvote
│    "bbb": 100      ← Got 1 upvote
│  }
│
├─ Winners:
│  Most votes: {"bbb": 1 vote}
│  winners = ["bbb"]
│
├─ Captions with vote counts:
│  "aaa": ["Top caption", "Bottom caption"] → 0 votes (cast vote)
│  "bbb": ["Different text", "Another text"] → 1 vote
│
└─ Broadcast to all clients:
   {
     "status": "results",
     "player_points": {"aaa": -50, "bbb": 100},
     "winners": ["bbb"],
     "votes": {"aaa": "bbb", "bbb": "aaa"},
     "captions": {"aaa": [...], "bbb": [...]},
     "submissions": [
       {user_id: "aaa", username: "Alice", captions: [...], meme: {...}},
       {user_id: "bbb", username: "Bob", captions: [...], meme: {...}}
     ]
   }
```

---

## Key Fixes Applied

```
┌─────────────────────────────────────────────────────────┐
│ FIX 1: Complete Game Start Broadcast                   │
├─────────────────────────────────────────────────────────┤
│ Before: ❌ Only sent status, duration                   │
│ After:  ✅ Sends full get_game_status_logic() result   │
│         Includes: is_creator, current_meme, players    │
│ Impact: All players see correct initial state           │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ FIX 2: Username Resolution                             │
├─────────────────────────────────────────────────────────┤
│ Before: ❌ Submissions only had user_id                 │
│ After:  ✅ Query all players once, map ID → username   │
│         Includes username in every submission           │
│ Impact: Players see names, not just IDs                │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ FIX 3: Vote Points Tracking                            │
├─────────────────────────────────────────────────────────┤
│ Before: ❌ Tried to use non-existent vote_points dict  │
│ After:  ✅ Use player_points directly from voting phase│
│         Points accumulate correctly                     │
│ Impact: Scores display correctly in results            │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ FIX 4: WebSocket Resilience                            │
├─────────────────────────────────────────────────────────┤
│ Before: ❌ No error handling, fails silently            │
│ After:  ✅ Exponential backoff, max 5 reconnection     │
│         Auto-reconnects on timeout                     │
│ Impact: Game continues through temporary disconnects   │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ FIX 5: Phase Synchronization                           │
├─────────────────────────────────────────────────────────┤
│ Before: ❌ Client timers could drift from server       │
│ After:  ✅ Request fresh status when countdown = 0    │
│         Server broadcasts complete phase state         │
│ Impact: All clients transition phases at same time    │
└─────────────────────────────────────────────────────────┘
```

All fixes ensure **guaranteed communication between frontend and backend** with no missing data or timing issues! ✅
