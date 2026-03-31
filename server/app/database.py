import aiosqlite
from pathlib import Path
from app.config import DATABASE_URL

_db: aiosqlite.Connection | None = None

DB_PATH = Path(__file__).resolve().parent.parent / DATABASE_URL


async def get_db() -> aiosqlite.Connection:
    if _db is None:
        raise RuntimeError("Database not initialized")
    return _db


async def init_db() -> None:
    global _db
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    _db = await aiosqlite.connect(str(DB_PATH))
    _db.row_factory = aiosqlite.Row
    await _db.execute("PRAGMA journal_mode=WAL")
    await _db.execute("PRAGMA foreign_keys=ON")
    await _create_tables(_db)


async def close_db() -> None:
    global _db
    if _db:
        await _db.close()
        _db = None


async def _create_tables(db: aiosqlite.Connection) -> None:
    await db.executescript("""
        CREATE TABLE IF NOT EXISTS players (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            username TEXT NOT NULL,
            password_hash TEXT,
            google_id TEXT UNIQUE,
            auth_provider TEXT NOT NULL DEFAULT 'email',
            coins INTEGER NOT NULL DEFAULT 0,
            total_earned INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS owned_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
            category TEXT NOT NULL,
            item_id TEXT NOT NULL,
            UNIQUE(player_id, category, item_id)
        );

        CREATE TABLE IF NOT EXISTS equipped_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
            category TEXT NOT NULL,
            item_id TEXT NOT NULL,
            UNIQUE(player_id, category)
        );

        CREATE TABLE IF NOT EXISTS skill_levels (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
            branch_id TEXT NOT NULL,
            level INTEGER NOT NULL DEFAULT 0,
            UNIQUE(player_id, branch_id)
        );

        CREATE TABLE IF NOT EXISTS high_scores (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            score INTEGER NOT NULL,
            wave INTEGER NOT NULL,
            difficulty TEXT NOT NULL,
            game_mode TEXT NOT NULL,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS achievements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
            achievement_id TEXT NOT NULL,
            unlocked_at TEXT NOT NULL,
            UNIQUE(player_id, achievement_id)
        );

        CREATE TABLE IF NOT EXISTS refresh_tokens (
            id TEXT PRIMARY KEY,
            player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
            token_hash TEXT NOT NULL,
            expires_at TEXT NOT NULL,
            created_at TEXT NOT NULL
        );
    """)
    await db.commit()
