# Make It Meme - Quick Cheat Sheet

## ⚡ 5-Minute Startup

### Files to Create

**Create: `backend/.env`**
```
DATABASE_URL=sqlite:///./test.db
FRONTEND_URLS=http://localhost:3000
ENVIRONMENT=development
```

**Create: `.env.local`**
```
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_WS_BASE_URL=ws://localhost:8000
```

### One-Time Setup (First Run Only)

```powershell
# Terminal 1: Backend setup
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt

# Terminal 2: Frontend setup
cd ..
npm install
```

### Run Every Time

**Terminal 1: Backend**
```powershell
cd backend
.\venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --reload --port 8000
```

**Terminal 2: Frontend**
```powershell
npm run dev
```

**Browser:**
```
http://localhost:3000
```

---

## 🎮 Testing Flow

```
1. Open 2 browser windows (both http://localhost:3000)
2. Player A: Create Room
3. Player B: Join Room (use room ID from A)
4. Both see each other listed
5. Player A: Click "▶️ Start Game"
6. Both: See meme, add captions, click "✅ Submit"
7. Auto-transition to voting (60s)
8. Both: Vote on submissions (👍 or 👎)
9. Auto-transition to results
10. Both: See winner and scores
11. Player A: Click "➡️ Next Meme" to loop
```

---

## 📊 What's Running

| Service | URL | Terminal |
|---------|-----|----------|
| Backend API | http://localhost:8000 | Terminal 1 |
| Backend WebSocket | ws://localhost:8000/ws/{room_id} | Terminal 1 |
| Frontend Dev | http://localhost:3000 | Terminal 2 |
| Database | backend/test.db | Auto-created |

---

## 🔧 Common Commands

| Task | Command |
|------|---------|
| Activate backend venv | `cd backend && .\venv\Scripts\Activate.ps1` |
| Deactivate venv | `deactivate` |
| Install backend deps | `pip install -r requirements.txt` |
| Install frontend deps | `npm install` |
| Run backend | `python -m uvicorn app.main:app --reload --port 8000` |
| Run frontend | `npm run dev` |
| Check backend health | `curl http://localhost:8000/templates` |
| Kill port 8000 | `netstat -ano \| findstr :8000` then `taskkill /PID <PID> /F` |
| Kill port 3000 | `netstat -ano \| findstr :3000` then `taskkill /PID <PID> /F` |

---

## ✅ Verification Checklist

```
□ Backend venv created
□ Backend dependencies installed  
□ Frontend dependencies installed
□ backend/.env created
□ .env.local created
□ Backend running on port 8000
□ Frontend running on port 3000
□ Browser loads http://localhost:3000
□ Can create room
□ Can join room
□ Can start game
□ Both players see meme
□ Both can add captions
□ Auto-switches to voting
□ Both can vote
□ Results show correctly
□ Can start next meme
```

---

## 🐛 Quick Fixes

| Problem | Solution |
|---------|----------|
| `ModuleNotFoundError` | `pip install -r requirements.txt` |
| Port 8000 in use | Kill process with `taskkill` |
| WebSocket fails | Restart both servers |
| Usernames don't show | Restart backend |
| Scores wrong | Restart backend |
| Stuck in phase | Refresh browser |

---

## 📂 File Locations

```
Project Root: c:\Users\paulf\Desktop\programming\Perso\mini\

Critical Files:
- backend/.env              ← CREATE THIS
- .env.local                ← CREATE THIS
- backend/app/main.py       ← Backend entry
- backend/app/game/meme.py  ← Game logic (FIXED)
- backend/app/routes/meme.py ← Endpoints (FIXED)
- pages/make_it_meme/room.js ← Frontend (FIXED)
- backend/test.db           ← Auto-created database

Documentation:
- INDEX.md                  ← All guides listed
- QUICK_REFERENCE.md        ← Quick start
- README_SETUP.md           ← Complete guide
- LOCAL_TESTING_GUIDE.md    ← Testing steps
- ARCHITECTURE.md           ← System design
```

---

## 🎯 API Endpoints (For Reference)

```
REST API:
POST   /meme/start_game/{room_id}
GET    /meme/templates

WebSocket:
WS     /ws/{room_id}?client_id={client_id}

Messages:
{type: "get_status"}           - Request game status
{type: "submit_caption", caption: [...]}  - Submit captions
{type: "submit_vote", vote_for: "id", points: 100}  - Vote
{type: "next_meme"}            - Advance to next meme
```

---

## 💾 Game State Data (For Debugging)

```javascript
// What's stored on backend for each game:
games[room_id] = {
  "players": ["Alice", "Bob"],
  "creator": "alice_id",
  "phase": "voting",                    // captioning|voting|results
  
  "current_meme": {
    "id": 1,
    "filename": "meme.jpg",
    "caption_slots": [{x, y, width, height}, ...]
  },
  
  "submissions": {
    "alice_id": {meme: {...}, captions: [...]},
    "bob_id": {meme: {...}, captions: [...]}
  },
  
  "votes": {
    "alice_id": "bob_id",
    "bob_id": "alice_id"
  },
  
  "player_points": {
    "alice_id": 100,
    "bob_id": -50
  },
  
  "start_time": 1234567890,
  "duration": 60,
  "meme_pool": [...remaining_memes...]
}
```

---

## 🌐 Environment Variables

```bash
# Backend (.env)
DATABASE_URL=sqlite:///./test.db
FRONTEND_URLS=http://localhost:3000
ENVIRONMENT=development

# Frontend (.env.local)
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_WS_BASE_URL=ws://localhost:8000
```

---

## 📈 Performance Tips

- **Local testing**: SQLite is fine
- **Production**: Use PostgreSQL
- **WebSocket**: Can handle ~100+ connections
- **Memory**: Games cleared after session ends
- **Database**: Auto-initialized on first run

---

## 🚀 Deployment URLs (Change for Production)

```bash
# Current (Local Development)
Backend:   http://localhost:8000
Frontend:  http://localhost:3000
WebSocket: ws://localhost:8000

# Production Example
Backend:   https://api.yourdomain.com
Frontend:  https://yourdomain.com
WebSocket: wss://api.yourdomain.com
```

---

## ✨ Fixes Applied

✅ Game start broadcasts complete state  
✅ Usernames included in all submissions  
✅ Vote points calculated correctly  
✅ WebSocket auto-reconnects on failure  
✅ Server drives phase transitions (not client)  

---

## 📖 Documentation Map

```
Start → INDEX.md
        ├─ QUICK_REFERENCE.md (5 min read)
        ├─ README_SETUP.md (complete guide)
        ├─ LOCAL_TESTING_GUIDE.md (step-by-step)
        ├─ ARCHITECTURE.md (diagrams)
        ├─ COMMUNICATION_FIXES.md (technical)
        └─ ENV_SETUP.md (configuration)
```

---

## 🎮 Testing Scenarios

### Scenario 1: Basic Game (2 players)
```
1. Player A creates room
2. Player B joins
3. A starts game
4. Both add captions → vote → see results
5. A advances to next meme
```

### Scenario 2: Multiple Games (4 players)
```
Room 1: Player A + B (one game)
Room 2: Player C + D (different game)
Both run independently
```

### Scenario 3: Network Interrupt
```
1. Game in progress
2. Close backend server
3. Frontend shows error, auto-reconnects
4. Restart backend
5. Frontend reconnects, game continues
```

---

## ⚙️ Debug Mode

To see everything:

**Browser Console (F12):**
```javascript
// Should see logs like:
✅ WebSocket connected
📦 data: {type: "game_update", ...}
```

**Backend Terminal:**
```
INFO: Uvicorn running on http://0.0.0.0:8000
✅ WebSocket connected
Received vote from ... with points: ...
```

---

## 🎯 Success Indicators

✅ Both servers start without errors  
✅ Frontend loads at localhost:3000  
✅ WebSocket shows "connected" in console  
✅ Can create and join rooms  
✅ Game phases auto-transition  
✅ All players see same data  
✅ Scores calculate correctly  

**If all above are true, you're good to go!** 🚀

---

## 💡 Pro Tips

1. Use **PowerShell** (native on Windows)
2. Use **Incognito windows** for different player sessions
3. Keep **backend terminal visible** for logs
4. Check **F12 Console** first on any error
5. **Restart servers** if anything weird happens
6. Use **different browsers** for better session isolation

---

## 🎉 You're Ready!

```powershell
# Copy & paste to get started:

# Terminal 1 (Backend)
cd backend
.\venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --reload --port 8000

# Terminal 2 (Frontend)
npm run dev

# Browser:
start http://localhost:3000
```

Open browser, create game, have fun! 🎮

---

For detailed guides, see: **INDEX.md** or **README_SETUP.md**
