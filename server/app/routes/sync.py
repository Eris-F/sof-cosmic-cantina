from fastapi import APIRouter, Depends

from app.auth import get_current_player
from app.database import get_db
from app.models.schemas import SyncRequest, SyncResponse
from app.services.player_service import get_player_info
from app.services.sync_service import merge_state

router = APIRouter(prefix="/sync", tags=["sync"])


@router.post("", response_model=SyncResponse)
async def sync(req: SyncRequest, player_id: str = Depends(get_current_player)):
    db = await get_db()
    state = await merge_state(db, player_id, req.state)
    info = await get_player_info(db, player_id)
    return SyncResponse(player=info, state=state)
