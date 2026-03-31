from fastapi import APIRouter, Depends

from app.auth import get_current_player
from app.database import get_db
from app.models.schemas import FullPlayerState, PlayerInfo, SyncResponse
from app.services.player_service import get_full_state, get_player_info

router = APIRouter(prefix="/players", tags=["players"])


@router.get("/me", response_model=SyncResponse)
async def get_me(player_id: str = Depends(get_current_player)):
    db = await get_db()
    info = await get_player_info(db, player_id)
    state = await get_full_state(db, player_id)
    return SyncResponse(player=info, state=state)
