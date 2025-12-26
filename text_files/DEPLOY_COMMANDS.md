# Quick Deploy Commands - Unified Heroku App

## First Time Setup

```bash
# 1. Create Heroku app
heroku create your-app-name

# 2. Add buildpacks (ORDER MATTERS!)
heroku buildpacks:add --index 1 heroku/nodejs
heroku buildpacks:add --index 2 heroku/python

# 3. Add PostgreSQL
heroku addons:create heroku-postgresql:essential-0

# 4. Set environment variables
heroku config:set SESSION_SECRET=$(openssl rand -hex 32)

# 5. Deploy
git push heroku main

# 6. Open app
heroku open
```

## Regular Deploys

```bash
# Commit changes
git add .
git commit -m "Your commit message"

# Push to Heroku
git push heroku main

# Watch logs
heroku logs --tail
```

## Useful Commands

```bash
# Check dyno status
heroku ps

# Restart dyno
heroku restart

# View config vars
heroku config

# Run database migrations manually
heroku run python backend/migrate.py

# Access PostgreSQL
heroku pg:psql

# View recent logs
heroku logs --tail

# Check buildpacks
heroku buildpacks
```

## Environment Variables

**Production (Heroku) - NO manual config needed!**
- `DATABASE_URL` - Auto-set by Postgres addon
- `PORT` - Auto-set by Heroku
- `NEXT_PUBLIC_BACKEND_URL` - Leave empty (same origin)
- `NEXT_PUBLIC_WS_BASE_URL` - Leave empty (same origin)
- `SESSION_SECRET` - Set once: `heroku config:set SESSION_SECRET=...`

**Development (.env file):**
```bash
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_WS_BASE_URL=ws://localhost:8000
DATABASE_URL=postgresql://localhost/mini_dev
SESSION_SECRET=dev-secret-key
```

## Troubleshooting

**Build fails:**
```bash
heroku logs --tail
heroku buildpacks  # Check order: 1.nodejs, 2.python
```

**App crashes:**
```bash
heroku logs --tail
heroku ps  # Check dyno status
heroku restart
```

**Database issues:**
```bash
heroku pg:info  # Check database status
heroku pg:psql  # Access database
```

**Static files not loading:**
```bash
heroku logs --tail | grep "Mounted"  # Check if Next.js static mounted
```

## Testing Checklist

After deployment:
- [ ] Homepage loads: `https://your-app.herokuapp.com/`
- [ ] CAH game works: `https://your-app.herokuapp.com/cards_against_humanity/`
- [ ] Meme game works: `https://your-app.herokuapp.com/make_it_meme/`
- [ ] WebSocket connects (check browser console)
- [ ] Multiple players can join
- [ ] Game starts and syncs properly
- [ ] Images load correctly
- [ ] Works on mobile (Safari iOS)

## Rollback

If deployment breaks:
```bash
# Rollback to previous version
heroku rollback

# Or specific version
heroku releases
heroku rollback v123
```
