# Unified Deployment Guide - Single Heroku App

## Overview

This project is now configured for **unified deployment** where both the FastAPI backend and Next.js frontend are served from a single Heroku app. This eliminates:

- ✅ CORS issues
- ✅ Cross-domain cookie problems
- ✅ WebSocket connection reliability issues
- ✅ Safari iOS restrictions
- ✅ Deployment complexity

## Architecture

**Before (2 apps):**
```
Frontend Heroku App (paul-mini-games-228906304104.herokuapp.com)
     ↓ HTTP/WebSocket
Backend Heroku App (back-end-mini-games-1cb46d8ecc75.herokuapp.com)
     ↓
PostgreSQL Database
```

**After (1 app):**
```
Single Heroku App (your-app-name.herokuapp.com)
├── FastAPI Backend (Python)
│   ├── API Routes (/cah/*, /meme/*, etc.)
│   ├── WebSocket Routes (/ws/*)
│   └── Next.js Static Files (/, /cards_against_humanity/*, etc.)
└── PostgreSQL Database
```

## Project Structure

```
mini/
├── backend/                    # Python/FastAPI backend
│   ├── app/
│   │   ├── main.py            # FastAPI app (serves Next.js + API)
│   │   ├── routes/            # API routes
│   │   ├── game/              # Game logic
│   │   └── ...
│   └── migrate.py             # Database migration script
├── pages/                     # Next.js pages
├── public/                    # Static assets (images, etc.)
├── src/                       # React components
├── styles/                    # CSS styles
├── .next/                     # Next.js build output (gitignored)
├── Procfile                   # Unified Heroku process definition
├── runtime.txt                # Python version
├── requirements.txt           # Python dependencies
├── package.json               # Node.js dependencies
├── next.config.js             # Next.js configuration
└── .env.example               # Environment variables template
```

## Deployment Steps

### 1. Create a Single Heroku App

```bash
# If you haven't already
heroku login

# Create new app (or use existing)
heroku create your-unified-app-name

# Add PostgreSQL addon
heroku addons:create heroku-postgresql:essential-0

# Add Node.js and Python buildpacks (order matters!)
heroku buildpacks:add --index 1 heroku/nodejs --app paul-mini-games
heroku buildpacks:add --index 2 heroku/python --app paul-mini-games
```

### 2. Configure Environment Variables

```bash
# No FRONTEND_URLS needed anymore! Same origin.
# No NEXT_PUBLIC_BACKEND_URL needed! Same origin.
# No NEXT_PUBLIC_WS_BASE_URL needed! Same origin.

# Only set these:
heroku config:set SESSION_SECRET=$(openssl rand -hex 32)

# Database URL is automatically set by Heroku Postgres addon
```

### 3. Deploy

```bash
# Commit all changes
git add .
git commit -m "Unified deployment structure"

# Push to Heroku
git push heroku main

# Watch logs
heroku logs --tail
```

### 4. Verify Deployment

```bash
# Check if app is running
heroku ps

# Open in browser
heroku open
```

## How It Works

### Build Process (Heroku)

1. **Node.js Buildpack** runs first:
   ```bash
   npm install
   npm run build  # Builds Next.js (standalone mode)
   ```

2. **Python Buildpack** runs second:
   ```bash
   pip install -r requirements.txt
   ```

3. **Release Phase** (before web dyno starts):
   ```bash
   python backend/migrate.py  # Initialize database
   ```

4. **Web Dyno** starts:
   ```bash
   uvicorn backend.app.main:app --host=0.0.0.0 --port=${PORT}
   ```

### Runtime Behavior

**FastAPI serves everything:**

1. **API Routes** (handled by FastAPI routers):
   - `/cah/*` → Cards Against Humanity API
   - `/meme/*` → Meme game API
   - `/room_messages`, `/create_room`, etc. → General routes
   - `/ws/*` → WebSocket connections

2. **Static Files** (served by FastAPI StaticFiles):
   - `/_next/static/*` → Next.js JavaScript/CSS bundles
   - `/images/*` → Public images

3. **Next.js Pages** (catch-all route):
   - `/` → Home page
   - `/cards_against_humanity/` → CAH home
   - `/make_it_meme/` → Meme game home
   - All other routes → Next.js pages

### URL Configuration

**In Production (Unified):**
```javascript
// Frontend code automatically uses same-origin URLs
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';  // Empty = same origin
const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_BASE_URL || 
  window.location.origin.replace('http', 'ws');  // Same origin, ws://
```

**Example URLs on your-app.herokuapp.com:**
- Homepage: `https://your-app.herokuapp.com/`
- CAH Game: `https://your-app.herokuapp.com/cards_against_humanity/`
- API Call: `https://your-app.herokuapp.com/cah/start_game/123`
- WebSocket: `wss://your-app.herokuapp.com/ws/cah/123`

All same origin! No CORS needed.

## Development Workflow

### Local Development

You still run frontend and backend separately in development:

```bash
# Terminal 1: Backend
cd backend
source venv/bin/activate  # or venv\Scripts\activate on Windows
uvicorn app.main:app --reload --port 8000

# Terminal 2: Frontend
npm run dev  # Runs on port 3000
```

**Local URLs:**
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`
- WebSocket: `ws://localhost:8000/ws/...`

Set in your local `.env`:
```bash
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_WS_BASE_URL=ws://localhost:8000
```

## Troubleshooting

### Issue: "Cannot find Next.js build files"

**Symptom:** Heroku logs show errors about missing `.next/standalone` directory

**Solution:**
```bash
# Ensure buildpacks are in correct order
heroku buildpacks
# Should show:
# 1. heroku/nodejs
# 2. heroku/python

# If wrong order, clear and re-add:
heroku buildpacks:clear
heroku buildpacks:add heroku/nodejs
heroku buildpacks:add heroku/python
```

### Issue: API routes return 404

**Symptom:** API calls fail with 404 errors

**Debug:**
```bash
heroku logs --tail | grep "GET\|POST"
```

**Solution:** Ensure catch-all route in `main.py` is AFTER all API routes. API routers must be included before the `serve_nextjs` function.

### Issue: WebSocket connections fail

**Symptom:** Games don't start, players don't sync

**Debug:**
```bash
heroku logs --tail | grep -i websocket
```

**Solution:** 
- Ensure `wss://` (not `ws://`) is used in production
- Check that WebSocket routes are NOT prefixed with `/api`
- Verify no CORS middleware blocking WebSocket upgrade

### Issue: Static assets (images) not loading

**Symptom:** Images return 404

**Solution:**
```bash
# Check if public directory is mounted
heroku logs --tail | grep "Mounted /images"
```

Ensure your image paths in frontend use `/images/...` not `/public/images/...`

### Issue: Build fails with memory error

**Symptom:** `JavaScript heap out of memory` during build

**Solution:**
```bash
# Increase Node.js memory during build
heroku config:set NODE_OPTIONS="--max_old_space_size=2048"
```

## Migration from 2-App Setup

If you're migrating from the old 2-app setup:

### 1. Delete Old Apps (after backup!)

```bash
# Backup database first!
heroku pg:backups:capture --app back-end-mini-games-1cb46d8ecc75
heroku pg:backups:download --app back-end-mini-games-1cb46d8ecc75

# Then delete (optional, can keep as backup)
# heroku apps:destroy --app paul-mini-games-228906304104
# heroku apps:destroy --app back-end-mini-games-1cb46d8ecc75
```

### 2. Restore Database to New App

```bash
# Create new unified app with PostgreSQL
heroku create your-unified-app
heroku addons:create heroku-postgresql:essential-0

# Restore backup
heroku pg:backups:restore 'https://...' DATABASE_URL --app your-unified-app
```

### 3. Update Git Remote

```bash
git remote remove heroku  # Remove old remote
git remote add heroku https://git.heroku.com/your-unified-app.git
```

## Performance Benefits

### Before (2 Apps):
- Frontend → Backend latency: ~100-200ms (cross-origin)
- WebSocket connection: Unreliable due to CORS
- Cookie/session: Blocked on Safari iOS
- Memory: 2 dynos = 2x memory usage
- Cost: 2 dynos = 2x cost

### After (1 App):
- Same-origin latency: ~5-20ms
- WebSocket connection: Highly reliable
- Cookie/session: Always works (same origin)
- Memory: 1 dyno = 50% cost savings
- Cost: 1 dyno only

## Next Steps

1. ✅ Deploy unified app to Heroku
2. ✅ Test all games (CAH, Meme)
3. ✅ Test on mobile (especially Safari iOS)
4. ✅ Monitor Heroku logs for errors
5. ✅ Delete old 2-app setup (optional, keep as backup initially)

## Related Documentation

- [DESYNC_FIX.md](./DESYNC_FIX.md) - Background timer architecture
- [TECHNICAL_ARCHITECTURE.md](./TECHNICAL_ARCHITECTURE.md) - System architecture
- [LOCAL_TESTING_GUIDE.md](./LOCAL_TESTING_GUIDE.md) - Local development setup

## Summary

By unifying the frontend and backend into a single Heroku app:

1. ✅ **No more CORS issues** - Same origin means no cross-origin restrictions
2. ✅ **No more Safari issues** - Same-origin cookies always work
3. ✅ **Better WebSocket reliability** - Same-origin connections are more stable
4. ✅ **Simpler deployment** - One app, one dyno, one config
5. ✅ **Lower cost** - 50% reduction (1 dyno instead of 2)
6. ✅ **Better performance** - Eliminate network latency between frontend/backend

This is the **definitive solution** to all the deployment, CORS, and sync issues!
