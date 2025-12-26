"""
Database migration script for Heroku release phase.
Ensures database schema is initialized before app starts.
"""
import os
import sys

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from app.db import init_db

if __name__ == "__main__":
    print("🗄️ Running database migrations...")
    try:
        init_db()
        print("✅ Database migrations complete")
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        sys.exit(1)
