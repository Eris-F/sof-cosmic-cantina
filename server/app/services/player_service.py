import uuid
from datetime import datetime, timezone

import aiosqlite

from app.models.schemas import (
    EquippedSchema,
    FullPlayerState,
    HighScoreEntry,
    OwnedSchema,
    PlayerInfo,
    SkillsSchema,
    WalletSchema,
)

DEFAULT_OWNED = {
    "skins": ["default"],
    "bullets": ["bread"],
    "trails": ["none"],
    "barriers": ["flowers"],
}

DEFAULT_EQUIPPED = {
    "skins": "default",
    "bullets": "bread",
    "trails": "none",
    "barriers": "flowers",
}

SKILL_BRANCHES = ["tequila", "skiing", "diving", "photography", "music"]


async def create_player(
    db: aiosqlite.Connection,
    email: str,
    username: str,
    password_hash: str | None,
    google_id: str | None,
    auth_provider: str,
) -> str:
    player_id = uuid.uuid4().hex
    now = datetime.now(timezone.utc).isoformat()

    await db.execute(
        """INSERT INTO players (id, email, username, password_hash, google_id, auth_provider, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
        (player_id, email, username, password_hash, google_id, auth_provider, now, now),
    )

    # Seed default owned items
    for category, items in DEFAULT_OWNED.items():
        for item_id in items:
            await db.execute(
                "INSERT INTO owned_items (player_id, category, item_id) VALUES (?, ?, ?)",
                (player_id, category, item_id),
            )

    # Seed default equipped items
    for category, item_id in DEFAULT_EQUIPPED.items():
        await db.execute(
            "INSERT INTO equipped_items (player_id, category, item_id) VALUES (?, ?, ?)",
            (player_id, category, item_id),
        )

    # Seed skill branches at level 0
    for branch in SKILL_BRANCHES:
        await db.execute(
            "INSERT INTO skill_levels (player_id, branch_id, level) VALUES (?, ?, 0)",
            (player_id, branch),
        )

    await db.commit()
    return player_id


async def get_player_info(db: aiosqlite.Connection, player_id: str) -> PlayerInfo:
    row = await db.execute_fetchall(
        "SELECT id, email, username, auth_provider FROM players WHERE id = ?",
        (player_id,),
    )
    if not row:
        raise ValueError("Player not found")
    r = row[0]
    return PlayerInfo(
        player_id=r["id"],
        email=r["email"],
        username=r["username"],
        auth_provider=r["auth_provider"],
    )


async def get_full_state(db: aiosqlite.Connection, player_id: str) -> FullPlayerState:
    wallet = await _get_wallet(db, player_id)
    owned = await _get_owned(db, player_id)
    equipped = await _get_equipped(db, player_id)
    skills = await _get_skills(db, player_id)
    achievements = await _get_achievements(db, player_id)
    high_scores = await _get_high_scores(db, player_id)

    return FullPlayerState(
        wallet=wallet,
        owned=owned,
        equipped=equipped,
        skills=skills,
        achievements=achievements,
        highScores=high_scores,
    )


async def _get_wallet(db: aiosqlite.Connection, player_id: str) -> WalletSchema:
    rows = await db.execute_fetchall(
        "SELECT coins, total_earned FROM players WHERE id = ?", (player_id,)
    )
    r = rows[0]
    return WalletSchema(coins=r["coins"], totalEarned=r["total_earned"])


async def _get_owned(db: aiosqlite.Connection, player_id: str) -> OwnedSchema:
    rows = await db.execute_fetchall(
        "SELECT category, item_id FROM owned_items WHERE player_id = ?", (player_id,)
    )
    owned: dict[str, list[str]] = {"skins": [], "bullets": [], "trails": [], "barriers": []}
    for r in rows:
        cat = r["category"]
        if cat in owned:
            owned[cat].append(r["item_id"])
    return OwnedSchema(**owned)


async def _get_equipped(db: aiosqlite.Connection, player_id: str) -> EquippedSchema:
    rows = await db.execute_fetchall(
        "SELECT category, item_id FROM equipped_items WHERE player_id = ?", (player_id,)
    )
    equipped = {}
    for r in rows:
        equipped[r["category"]] = r["item_id"]
    return EquippedSchema(**equipped)


async def _get_skills(db: aiosqlite.Connection, player_id: str) -> SkillsSchema:
    rows = await db.execute_fetchall(
        "SELECT branch_id, level FROM skill_levels WHERE player_id = ?", (player_id,)
    )
    skills = {}
    for r in rows:
        skills[r["branch_id"]] = r["level"]
    return SkillsSchema(**skills)


async def _get_achievements(db: aiosqlite.Connection, player_id: str) -> list[str]:
    rows = await db.execute_fetchall(
        "SELECT achievement_id FROM achievements WHERE player_id = ?", (player_id,)
    )
    return [r["achievement_id"] for r in rows]


async def _get_high_scores(
    db: aiosqlite.Connection, player_id: str
) -> list[HighScoreEntry]:
    rows = await db.execute_fetchall(
        "SELECT name, score, wave, difficulty, game_mode, created_at FROM high_scores WHERE player_id = ? ORDER BY score DESC LIMIT 10",
        (player_id,),
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
