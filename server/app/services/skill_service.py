import aiosqlite
from datetime import datetime, timezone

from app.models.schemas import SkillsSchema, WalletSchema

MAX_SKILL_LEVEL = 5

# Cost per level per branch — index 0 = cost to go from level 0 to 1
SKILL_COSTS: dict[str, list[int]] = {
    "tequila": [100, 250, 500, 1000, 2000],
    "skiing": [100, 250, 500, 1000, 2000],
    "diving": [100, 300, 600, 1200, 2500],
    "photography": [100, 250, 500, 1000, 2000],
    "music": [150, 350, 700, 1500, 3000],
}


async def upgrade_skill(
    db: aiosqlite.Connection,
    player_id: str,
    branch_id: str,
) -> tuple[WalletSchema, SkillsSchema]:
    if branch_id not in SKILL_COSTS:
        raise ValueError(f"Unknown branch: {branch_id}")

    # Get current level
    rows = await db.execute_fetchall(
        "SELECT level FROM skill_levels WHERE player_id = ? AND branch_id = ?",
        (player_id, branch_id),
    )
    if not rows:
        raise ValueError("Skill branch not initialized")

    current_level = rows[0]["level"]
    if current_level >= MAX_SKILL_LEVEL:
        raise ValueError("Already max level")

    cost = SKILL_COSTS[branch_id][current_level]

    # Check balance
    wallet_rows = await db.execute_fetchall(
        "SELECT coins FROM players WHERE id = ?", (player_id,)
    )
    coins = wallet_rows[0]["coins"]
    if coins < cost:
        raise ValueError("Not enough coins")

    now = datetime.now(timezone.utc).isoformat()
    await db.execute(
        "UPDATE players SET coins = coins - ?, updated_at = ? WHERE id = ?",
        (cost, now, player_id),
    )
    await db.execute(
        "UPDATE skill_levels SET level = ? WHERE player_id = ? AND branch_id = ?",
        (current_level + 1, player_id, branch_id),
    )
    await db.commit()

    from app.services.player_service import _get_skills, _get_wallet
    wallet = await _get_wallet(db, player_id)
    skills = await _get_skills(db, player_id)
    return wallet, skills
