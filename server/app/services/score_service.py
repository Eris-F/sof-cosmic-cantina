import aiosqlite
from datetime import datetime, timezone

from app.models.schemas import HighScoreEntry


async def submit_score(
    db: aiosqlite.Connection,
    player_id: str,
    name: str,
    score: int,
    wave: int,
    difficulty: str,
    game_mode: str,
) -> list[HighScoreEntry]:
    now = datetime.now(timezone.utc).isoformat()
    await db.execute(
        """INSERT INTO high_scores (player_id, name, score, wave, difficulty, game_mode, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)""",
        (player_id, name[:3], score, wave, difficulty, game_mode, now),
    )
    await db.commit()
    return await get_leaderboard(db, limit=20)


async def get_leaderboard(
    db: aiosqlite.Connection,
    limit: int = 20,
) -> list[HighScoreEntry]:
    rows = await db.execute_fetchall(
        "SELECT name, score, wave, difficulty, game_mode, created_at FROM high_scores ORDER BY score DESC LIMIT ?",
        (limit,),
    )
    return [
        HighScoreEntry(
            name=r["name"],
            score=r["score"],
            wave=r["wave"],
            difficulty=r["difficulty"],
            gameMode=r["game_mode"],
            date=r["created_at"],
        )
        for r in rows
    ]
