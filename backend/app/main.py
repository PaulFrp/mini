from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import re
from .db import init_db
from contextlib import asynccontextmanager
from .routes import general, room, voting, meme, websockets, cah, who_said_it
from .tasks.cleanup import cleanup_empty_rooms_task
import asyncio
import os
from dotenv import load_dotenv
from pathlib import Path




# uvicorn app.main:app --reload

if not os.getenv("DATABASE_URL"):
    load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    cleanup_task = asyncio.create_task(cleanup_empty_rooms_task())
    yield
        # 🧹 On shutdown
    for task in (cleanup_task):
        task.cancel()
        try:
            await task
        except asyncio.CancelledError:
            pass


app = FastAPI(lifespan=lifespan)

# Determine if we're in production (Heroku) or development
IS_PRODUCTION = bool(os.getenv("DATABASE_URL"))

# CORS configuration - simplified since frontend and backend will be same origin in production
if IS_PRODUCTION:
    # In production (unified deployment), CORS is minimal since same-origin
    print("🌐 Production mode: Unified deployment (same origin)")
    allowed_origins = ["*"]  # Allow all since we're serving frontend from same app
else:
    # In development, allow localhost for Next.js dev server
    frontend_urls = os.getenv("FRONTEND_URLS", "http://localhost:3000")
    allowed_origins = [url.strip() for url in frontend_urls.split(",")]
    print(f"🌐 Development mode: CORS allowed origins: {allowed_origins}")

def build_origin_regex(origins):
    # Build a regex that matches any origin in the list, with an optional :port suffix
    patterns = []
    for url in origins:
        u = url.rstrip('/')
        patterns.append(re.escape(u) + r"(?:\:\d+)?")
    return "(" + "|".join(patterns) + ")"

origin_regex = build_origin_regex(allowed_origins)

print(f"🔐 Environment: {'Production' if IS_PRODUCTION else 'Development'}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# API Routers - these handle backend logic (NO /api prefix to keep compatibility)
app.include_router(general.router)
app.include_router(room.router)
app.include_router(voting.router, prefix="/voting")
app.include_router(meme.router, prefix="/meme")
app.include_router(cah.router, prefix="/cah")
app.include_router(who_said_it.router, prefix="/who_said_it", tags=["who_said_it"])
app.include_router(websockets.router)  # WebSocket routes

# Serve Next.js static files in production (MUST BE AFTER API routes)
if IS_PRODUCTION:
    # Path to Next.js standalone build
    NEXTJS_BUILD_DIR = Path(__file__).parent.parent.parent / ".next" / "standalone"
    NEXTJS_STATIC_DIR = Path(__file__).parent.parent.parent / ".next" / "static"
    NEXTJS_PUBLIC_DIR = Path(__file__).parent.parent.parent / "public"
    NEXTJS_PAGES_DIR = NEXTJS_BUILD_DIR / ".next" / "server" / "pages"
    
    print(f"📁 Next.js build dir: {NEXTJS_BUILD_DIR}")
    print(f"📁 Next.js pages dir: {NEXTJS_PAGES_DIR}")
    print(f"📁 Next.js static dir: {NEXTJS_STATIC_DIR}")
    print(f"📁 Next.js public dir: {NEXTJS_PUBLIC_DIR}")
    
    # Serve _next/static files
    if NEXTJS_STATIC_DIR.exists():
        app.mount("/_next/static", StaticFiles(directory=str(NEXTJS_STATIC_DIR)), name="nextjs-static")
        print("✅ Mounted /_next/static")
    
    # Serve public files (images, etc.)
    if NEXTJS_PUBLIC_DIR.exists():
        app.mount("/images", StaticFiles(directory=str(NEXTJS_PUBLIC_DIR / "images")), name="images")
        print("✅ Mounted /images")
    
    # Catch-all route to serve Next.js pages (MUST be last, after all API routes)
    @app.get("/{full_path:path}")
    async def serve_nextjs(full_path: str):
        """Serve Next.js pages for all non-API routes"""
        # API and WebSocket routes are already handled above, so this only catches page requests
        
        # For root path, serve index
        if full_path == "" or full_path == "/":
            root_index = NEXTJS_PAGES_DIR / "index.html"
            if root_index.exists():
                return FileResponse(root_index)
        
        # Try to serve the specific Next.js page (with trailing slash removed)
        clean_path = full_path.rstrip('/')
        page_path = NEXTJS_PAGES_DIR / f"{clean_path}.html"
        if page_path.exists():
            return FileResponse(page_path)
        
        # Try index.html for directory paths
        index_path = NEXTJS_PAGES_DIR / clean_path / "index.html"
        if index_path.exists():
            return FileResponse(index_path)
        
        # Fall back to root index.html for client-side routing
        root_index = NEXTJS_PAGES_DIR / "index.html"
        if root_index.exists():
            return FileResponse(root_index)
        
        return {"error": "Page not found", "path": full_path}
    
    print("✅ Next.js frontend serving configured")
else:
    print("⚠️ Development mode: Run 'npm run dev' separately on port 3000")

