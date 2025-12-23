# Local Testing Guide - Make It Meme Game

## Architecture Overview

Your project has 3 main components:
```
┌─────────────────────────────────────────────────────┐
│         Frontend (Next.js/React)                    │
│  - pages/make_it_meme/room.js (game client)        │
│  - Running on: http://localhost:3000                │
└─────────────────┬───────────────────────────────────┘
                  │ WebSocket + REST API
                  ▼
┌─────────────────────────────────────────────────────┐
│         Backend (FastAPI/Python)                    │
│  - backend/app/main.py (server)                     │
│  - WebSocket: ws://localhost:8000/ws/{room_id}      │
│  - REST API: http://localhost:8000                  │
└─────────────────┬───────────────────────────────────┘
                  │ SQL Database
                  ▼
┌─────────────────────────────────────────────────────┐
│         Database (SQLite/PostgreSQL)                │
│  - Rooms, Players, Game State                       │
└─────────────────────────────────────────────────────┘
```

---

## Prerequisites

- **Python 3.10+** (for backend)
- **Node.js 16+** (for frontend)
- **Git** (already have it)

---

## Step 1: Backend Setup & Testing

### 1.1 Create Python Virtual Environment

```powershell
# Navigate to backend
cd c:\Users\paulf\Desktop\programming\Perso\mini\backend

# Create virtual environment
python -m venv venv

# Activate it
.\venv\Scripts\Activate.ps1

# If that fails, try:
.\venv\Scripts\activate.bat
```

### 1.2 Install Dependencies

```powershell
# Make sure you're in the venv and backend directory
pip install --upgrade pip
pip install -r requirements.txt
```

**What gets installed:**
- FastAPI (web framework)
- Uvicorn (ASGI server)
- SQLAlchemy (database ORM)
- python-dotenv (environment variables)
- python-multipart (form data)
- Any other requirements in `requirements.txt`

### 1.3 Setup Environment Variables

Create a `.env` file in the `backend/` directory:

```bash
# Database (SQLite for local testing, no setup needed)
DATABASE_URL=sqlite:///./test.db

# Frontend URLs (for CORS)
FRONTEND_URLS=http://localhost:3000

# Optional: Set to "production" for prod, "development" for local
ENVIRONMENT=development
```

### 1.4 Run Backend Server

```powershell
# From backend/ directory with venv activated
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Expected output:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started server process [12345]
```

**Testing backend is running:**
```powershell
# In another terminal
curl http://localhost:8000/templates
```

Should return JSON with meme templates.

---

## Step 2: Frontend Setup & Testing

### 2.1 Install Dependencies

```powershell
# Navigate to frontend root
cd c:\Users\paulf\Desktop\programming\Perso\mini

# Install packages
npm install
```

### 2.2 Setup Environment Variables

Create a `.env.local` file in the project root:

```bash
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_WS_BASE_URL=ws://localhost:8000
```

**Important notes:**
- `NEXT_PUBLIC_` prefix makes these available in the browser
- Change to your server's IP/domain when deploying
- WebSocket URL should match backend port

### 2.3 Run Frontend Dev Server

```powershell
# From project root
npm run dev
```

**Expected output:**
```
> next dev
  ▲ Next.js 14.x.x
  - ready started server on 0.0.0.0:3000
```

Open: http://localhost:3000

---

## Step 3: Testing the Game (Complete Flow)

### 3.1 Open Multiple Browser Windows

For testing multiplayer, you need **at least 2 players**:

1. **Browser 1 (Player A):** http://localhost:3000
2. **Browser 2 (Player B):** http://localhost:3000
   - Or use Incognito/Private window (different session)
   - Or different browser (Chrome + Firefox)

### 3.2 Create a Game Room

**Player A:**
1. Navigate to "Make It Meme" section
2. Click "Create Room" or similar
3. Get the room ID (should be displayed)

**Player B:**
1. Navigate to "Make It Meme"
2. Click "Join Room"
3. Enter the room ID from Player A

**Verify:** Both should see each other in player list

### 3.3 Start & Play Game

**Player A (Creator):**
1. Click "▶️ Start Game" button
2. Both players should see the meme and caption boxes

**Both Players:**
1. Fill in captions for the empty text boxes
2. Click "✅ Submit"
3. Wait for timer (⏳ 60s)

**After captioning phase:**
- Phase switches to "🗳️ Voting"
- Each player sees the other's meme submissions
- Vote with 👍 Upvote (+100) or 👎 Downvote (-50)

**After voting:**
- Phase shows "🏆 Results" with scores
- Player A can click "➡️ Next Meme" to continue

---

## Step 4: Debugging Common Issues

### Issue: "Connection refused" on WebSocket

**Symptoms:**
```
WebSocket connection to 'ws://localhost:8000/ws/...' failed
```

**Solution:**
1. Verify backend is running: `http://localhost:8000/templates` in browser
2. Check backend logs for errors
3. Verify `.env.local` has correct `NEXT_PUBLIC_WS_BASE_URL`
4. Restart both frontend and backend

### Issue: "You are not in a room" message

**Symptoms:**
Player sees: "You are not in a room or session expired."

**Solution:**
1. Make sure you created/joined a room first
2. Check browser DevTools Console for errors
3. Verify database is working: Check `test.db` was created in backend/

### Issue: Game doesn't start for everyone

**Symptoms:**
- Player A starts game
- Player B still sees "Waiting for host..."

**Solution:**
1. Check browser console (F12 → Console tab) for errors
2. Verify both have active WebSocket connections
3. Check backend logs for broadcast errors
4. Restart game and try again

### Issue: Timers desynchronized

**Symptoms:**
Players see different countdown times or phase transitions at different times

**Solution:**
This should be fixed by the communication improvements. If still happening:
1. Verify both clients get `remaining` field in WebSocket messages
2. Check backend `get_game_status_logic()` is called
3. Make sure `NEXT_PUBLIC_WS_BASE_URL` is correct

---

## Step 5: Monitoring & Debugging

### Check Backend Logs

```powershell
# Backend terminal shows:
✅ WebSocket connected
📦 /room_messages data: {...}
Received vote from ... for ... with points: ...
```

### Check Frontend Logs

```
Open DevTools: F12 → Console tab
Look for:
✅ WebSocket connected
📦 data: {type: "game_update", status: "captioning", ...}
```

### Database Inspection

```powershell
# Check SQLite database
cd backend
python -c "from app.db import SessionLocal; from app.models import Room; db = SessionLocal(); print([r.id for r in db.query(Room).all()])"
```

---

## Step 6: Running Multiple Games Simultaneously

To test multiple rooms:

```powershell
# Terminal 1: Backend
cd backend
.\venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --reload --port 8000

# Terminal 2: Frontend
cd mini
npm run dev

# Terminal 3+: Open multiple browser windows
# Each at http://localhost:3000
# Create different rooms for each group
```

---

## Step 7: Production-like Testing

### Simulate Network Issues (Optional)

To test WebSocket reconnection logic:

```powershell
# Temporarily stop backend and restart it
# Frontend should automatically reconnect (you'll see "Connection error. Attempting to reconnect...")
```

### Test with Different Machines

Change `.env.local` on frontend to use your machine's local IP:

```bash
NEXT_PUBLIC_BACKEND_URL=http://192.168.1.100:8000
NEXT_PUBLIC_WS_BASE_URL=ws://192.168.1.100:8000
```

Then access frontend from another machine:
```
http://192.168.1.100:3000
```

---

## Quick Command Reference

```powershell
# Backend startup
cd backend && .\venv\Scripts\Activate.ps1 && python -m uvicorn app.main:app --reload --port 8000

# Frontend startup
cd mini && npm run dev

# Deactivate venv
deactivate

# Kill process on port 8000 (if stuck)
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Kill process on port 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

---

## File Structure Reference

```
mini/
├── backend/              ← Backend (FastAPI)
│   ├── .env              ← Backend environment vars
│   ├── requirements.txt
│   └── app/
│       ├── main.py       ← FastAPI app entry
│       ├── db.py         ← Database setup
│       ├── models.py     ← SQLAlchemy models
│       ├── game/
│       │   └── meme.py   ← Game logic (FIXED ✅)
│       └── routes/
│           ├── meme.py   ← Game endpoints (FIXED ✅)
│           └── websockets.py ← WebSocket handler
│
├── pages/                ← Frontend (Next.js)
│   └── make_it_meme/
│       └── room.js       ← Game client (FIXED ✅)
│
├── src/                  ← Frontend React components
│
├── .env.local            ← Frontend environment vars
├── package.json
└── README.md
```

---

## Summary of Recent Fixes

All communication issues have been fixed:

✅ **Game start broadcast** - Now includes all required fields  
✅ **Username display** - Fixed missing names in voting phase  
✅ **Score calculation** - Vote points now tracked correctly  
✅ **WebSocket resilience** - Auto-reconnection with exponential backoff  
✅ **Phase synchronization** - Server is source of truth for phase timing  

**Files modified:**
- `backend/app/routes/meme.py` - Game start endpoint
- `backend/app/game/meme.py` - Game state & phase logic
- `pages/make_it_meme/room.js` - Frontend WebSocket handling

All backend files are intact and have the fixes applied! 🎉
