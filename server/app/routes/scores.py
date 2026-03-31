from fastapi import APIRouter, Depends

from app.auth import get_current_player
from app.database import get_db
from app.models.schemas import ScoreSubmitRequest, ScoresResponse
from app.services.score_service import get_leaderboard, submit_score

router = APIRouter(prefix="/scores", tags=["scores"])


@router.post("", response_model=ScoresResponse)
async def post_score(req: ScoreSubmitRequest, player_id: str = Depends(get_current_player)):
    db = await get_db()
    scores = await submit_score(
        db, player_id, req.name, req.score, req.wave, req.difficulty, req.gameMode
    )
    return ScoresResponse(highScores=scores)


@router.get("", response_model=ScoresResponse)
async def leaderboard(limit: int = 20):
    db = await get_db()
    scores = await get_leaderboard(db, limit=min(limit, 100))
    return ScoresResponse(highScores=scores)
