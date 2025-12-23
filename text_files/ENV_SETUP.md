# Environment Variable Setup Templates

## Backend Environment (.env file)

Create this file at: `backend/.env`

```bash
# Database configuration
# For local development, SQLite is fine (no setup needed)
DATABASE_URL=sqlite:///./test.db

# For PostgreSQL (when deployed):
# DATABASE_URL=postgresql://user:password@localhost/meme_game

# Frontend URLs (for CORS)
# These tell the backend which frontend URLs are allowed
FRONTEND_URLS=http://localhost:3000

# For production with multiple domains:
# FRONTEND_URLS=https://yourdomain.com,https://www.yourdomain.com

# Environment mode
ENVIRONMENT=development

# Optional: Database pool settings
# DB_POOL_SIZE=5
# DB_MAX_OVERFLOW=10
```

---

## Frontend Environment (.env.local file)

Create this file at: `mini/.env.local` (project root)

```bash
# Backend API URL (for REST calls)
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000

# WebSocket URL (for real-time game updates)
NEXT_PUBLIC_WS_BASE_URL=ws://localhost:8000

# Optional: Analytics, tracking, etc.
# NEXT_PUBLIC_ANALYTICS_ID=...
```

---

## Production-Ready Templates

### For Backend Production (backend/.env.prod)

```bash
# PostgreSQL on Azure/AWS/GCP
DATABASE_URL=postgresql://username:password@server.com/database

# Actual domain names
FRONTEND_URLS=https://yourdomain.com,https://www.yourdomain.com

# Production mode
ENVIRONMENT=production

# Connection pooling
DB_POOL_SIZE=10
DB_MAX_OVERFLOW=20

# Optional: Logging level
LOG_LEVEL=INFO
```

### For Frontend Production (mini/.env.production)

```bash
# Your production backend domain
NEXT_PUBLIC_BACKEND_URL=https://api.yourdomain.com

# WebSocket URL (usually same domain with wss://)
NEXT_PUBLIC_WS_BASE_URL=wss://api.yourdomain.com
```

---

## Docker Environment (if using containers)

### backend/Dockerfile.env
```bash
# Build args
BUILD_ENV=production

# Runtime env vars passed at docker run
# docker run -e DATABASE_URL="..." -e FRONTEND_URLS="..."
```

### Example docker-compose.yml
```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    environment:
      DATABASE_URL: postgresql://meme:password@db:5432/meme_game
      FRONTEND_URLS: http://frontend:3000
    ports:
      - "8000:8000"

  frontend:
    build: ./
    environment:
      NEXT_PUBLIC_BACKEND_URL: http://backend:8000
      NEXT_PUBLIC_WS_BASE_URL: ws://backend:8000
    ports:
      - "3000:3000"

  db:
    image: postgres:15
    environment:
      POSTGRES_USER: meme
      POSTGRES_PASSWORD: password
      POSTGRES_DB: meme_game
    volumes:
      - db_data:/var/lib/postgresql/data

volumes:
  db_data:
```

---

## Environment Variable Reference

### Backend Variables

| Variable | Purpose | Local Example | Production Example |
|----------|---------|---|---|
| `DATABASE_URL` | Database connection | `sqlite:///./test.db` | `postgresql://user:pass@host/db` |
| `FRONTEND_URLS` | Allowed frontend origins (CORS) | `http://localhost:3000` | `https://yourdomain.com` |
| `ENVIRONMENT` | App mode | `development` | `production` |
| `DB_POOL_SIZE` | DB connection pool size | `5` | `10` |
| `LOG_LEVEL` | Logging verbosity | `DEBUG` | `INFO` |

### Frontend Variables

| Variable | Purpose | Local Example | Production Example |
|----------|---------|---|---|
| `NEXT_PUBLIC_BACKEND_URL` | REST API base URL | `http://localhost:8000` | `https://api.yourdomain.com` |
| `NEXT_PUBLIC_WS_BASE_URL` | WebSocket URL | `ws://localhost:8000` | `wss://api.yourdomain.com` |

---

## Quick Setup Command

### One-time setup:

```powershell
# Create backend .env
@"
DATABASE_URL=sqlite:///./test.db
FRONTEND_URLS=http://localhost:3000
ENVIRONMENT=development
"@ | Out-File -Encoding UTF8 backend\.env

# Create frontend .env.local
@"
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_WS_BASE_URL=ws://localhost:8000
"@ | Out-File -Encoding UTF8 .env.local

Write-Host "Environment files created!"
```

---

## Important Notes

1. **Never commit `.env` files to Git** - Add to `.gitignore`:
   ```
   backend/.env
   .env.local
   .env.production
   ```

2. **Local vs Production URLs:**
   - Local: `http://localhost:8000` (HTTP, localhost)
   - Production: `https://yourdomain.com` (HTTPS, real domain)

3. **WebSocket URLs:**
   - Local: `ws://localhost:8000` (plain WebSocket)
   - Production: `wss://yourdomain.com` (secure WebSocket)
   - Always use `wss://` in production (secure)

4. **CORS Configuration:**
   - Backend must list all frontend domains in `FRONTEND_URLS`
   - Separate multiple URLs with commas
   - Must match exactly (protocol + domain + port)

5. **Database Passwords:**
   - Use strong passwords in production
   - Store securely in platform secrets (Azure, AWS, etc.)
   - Never hardcode in files

---

## Testing Your Configuration

```powershell
# Test backend can read environment
cd backend
python -c "import os; from dotenv import load_dotenv; load_dotenv(); print('DATABASE_URL:', os.getenv('DATABASE_URL'))"

# Test frontend can see public variables
cd ..
npm run dev
# Check console: console.log(process.env.NEXT_PUBLIC_BACKEND_URL)
```

You're ready to start! 🚀
