# Heroku Environment Variables Setup

## Your Current Setup

**Backend App:** `back-end-mini-games-1cb46d8ecc75`
**Frontend App:** `paul-mini-games-228906304104`
**Custom Domain:** `www.paul-mini-games.fr`

## Backend Environment Variables (REQUIRED)

Run these commands to configure your **BACKEND** Heroku app:

```bash
# Set your frontend URL(s) - include both www and non-www versions
heroku config:set FRONTEND_URLS="https://paul-mini-games-228906304104.herokuapp.com,https://www.paul-mini-games.fr,https://paul-mini-games.fr" --app back-end-mini-games-1cb46d8ecc75

# Verify DATABASE_URL is set (should be automatic with Postgres addon)
heroku config:get DATABASE_URL --app back-end-mini-games-1cb46d8ecc75

# Optional: Set a secret key for session signing if not already set
heroku config:set SECRET_KEY="your-secret-key-here" --app back-end-mini-games-1cb46d8ecc75
```

## Frontend Environment Variables (REQUIRED)

Run these commands to configure your **FRONTEND** Heroku app:

```bash
# Set backend API URL
heroku config:set NEXT_PUBLIC_BACKEND_URL="https://back-end-mini-games-1cb46d8ecc75.herokuapp.com" --app paul-mini-games-228906304104

# Set WebSocket URL (note: use wss:// not https://)
heroku config:set NEXT_PUBLIC_WS_BASE_URL="wss://back-end-mini-games-1cb46d8ecc75.herokuapp.com" --app paul-mini-games-228906304104
```

## Current Issue: CORS Configuration

The error logs show OPTIONS requests failing with 400 Bad Request. This typically means:

1. **FRONTEND_URLS not set**: Your backend doesn't know which origins to allow
2. **Missing preflight handling**: OPTIONS requests need to succeed before POST/GET

## Quick Fix Commands

```bash
# Check current config
heroku config --app back-end-mini-games-1cb46d8ecc75

# Set frontend URL (update with your actual frontend domain)
heroku config:set FRONTEND_URLS="https://your-actual-frontend-domain.com" --app back-end-mini-games-1cb46d8ecc75

# Restart the app
heroku restart --app back-end-mini-games-1cb46d8ecc75

# View logs
heroku logs --tail --app back-end-mini-games-1cb46d8ecc75
```

## Testing CORS

After deploying, test with:

```bash
curl -X OPTIONS https://back-end-mini-games-1cb46d8ecc75.herokuapp.com/create_room \
  -H "Origin: https://your-frontend-domain.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: x-client-id,content-type" \
  -v
```

You should see:
- Status: 200 OK
- Access-Control-Allow-Origin header in response
- Access-Control-Allow-Headers header in response

## Additional Notes

- The SQLAlchemy warning about `confirm_deleted_rows` is just a warning and won't break your app
- Make sure your frontend is sending requests to the correct backend URL
- Cookies require `secure=True` and `samesite="none"` for cross-domain (already configured)
