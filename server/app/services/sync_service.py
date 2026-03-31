import aiosqlite
from datetime import datetime, timezone

from app.models.schemas import FullPlayerState, HighScoreEntry
from app.services.player_service import get_full_state


async def merge_state(
    db: aiosqlite.Connection,
    player_id: str,
    client: FullPlayerState,
) -> FullPlayerState:
    """Merge client offline state with server authority.

    Rules:
    - Wallet: server wins (prevents cheating / stale cache)
    - Owned: server wins (unvalidated buys ignored)
    - Equipped: client wins IF item is server-owned, else default
    - Skills: server wins
    - Achievements: union (never revocable)
    - Scores: union (dedupe by name+score+wave)
    """
    now = datetime.now(timezone.utc).isoformat()

    # --- Achievements: union ---
    server_achs = await db.execute_fetchall(
        "SELECT achievement_id FROM achievements WHERE player_id = ?", (player_id,)
    )
    existing = {r["achievement_id"] for r in server_achs}
    for ach_id in client.achievements:
        if ach_id not in existing:
            await db.execute(
                "INSERT OR IGNORE INTO achievements (player_id, achievement_id, unlocked_at) VALUES (?, ?, ?)",
                (player_id, ach_id, now),
            )

    # --- Scores: union by (name, score, wave) ---
    server_scores = await db.execute_fetchall(
        "SELECT name, score, wave FROM high_scores WHERE player_id = ?", (player_id,)
    )
    existing_scores = {(r["name"], r["score"], r["wave"]) for r in server_scores}
    for hs in client.highScores:
        key = (hs.name, hs.score, hs.wave)
        if key not in existing_scores:
            await db.execute(
                """INSERT INTO high_scores (player_id, name, score, wave, difficulty, game_mode, created_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?)""",
                (player_id, hs.name, hs.score, hs.wave, hs.difficulty, hs.gameMode, hs.date or now),
            )

    # --- Equipped: client preference, validated ---
    server_owned = await db.execute_fetchall(
        "SELECT category, item_id FROM owned_items WHERE player_id = ?", (player_id,)
    )
    owned_set: dict[str, set[str]] = {}
    for r in server_owned:
        owned_set.setdefault(r["category"], set()).add(r["item_id"])

    equipped_dict = client.equipped.model_dump()
    for category, item_id in equipped_dict.items():
        if item_id in owned_set.get(category, set()):
            await db.execute(
                "INSERT OR REPLACE INTO equipped_items (player_id, category, item_id) VALUES (?, ?, ?)",
                (player_id, category, item_id),
            )

    await db.commit()

    # Return authoritative state
    return await get_full_state(db, player_id)
