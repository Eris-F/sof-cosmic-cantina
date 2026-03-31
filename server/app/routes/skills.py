from fastapi import APIRouter, Depends, HTTPException

from app.auth import get_current_player
from app.database import get_db
from app.models.schemas import SkillResponse, UpgradeRequest
from app.services.skill_service import upgrade_skill

router = APIRouter(prefix="/skills", tags=["skills"])


@router.post("/upgrade", response_model=SkillResponse)
async def upgrade(req: UpgradeRequest, player_id: str = Depends(get_current_player)):
    db = await get_db()
    try:
        wallet, skills = await upgrade_skill(db, player_id, req.branchId)
    except ValueError as e:
        raise HTTPException(400, str(e))
    return SkillResponse(wallet=wallet, skills=skills)
