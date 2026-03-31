from datetime import datetime, timezone

from fastapi import APIRouter, Depends

from app.auth import get_current_player
from app.database import get_db
from app.models.schemas import AchievementUnlockRequest, AchievementsResponse

router = APIRouter(prefix="/achievements", tags=["achievements"])


@router.post("", response_model=AchievementsResponse)
async def unlock(req: AchievementUnlockRequest, player_id: str = Depends(get_current_player)):
    db = await get_db()
    now = datetime.now(timezone.utc).isoformat()
    for ach_id in req.achievementIds:
        await db.execute(
            "INSERT OR IGNORE INTO achievements (player_id, achievement_id, unlocked_at) VALUES (?, ?, ?)",
            (player_id, ach_id, now),
        )
    await db.commit()

    rows = await db.execute_fetchall(
        "SELECT achievement_id FROM achievements WHERE player_id = ?", (player_id,)
    )
    return AchievementsResponse(achievements=[r["achievement_id"] for r in rows])
