from fastapi import APIRouter, Depends, HTTPException

from app.auth import get_current_player
from app.database import get_db
from app.models.schemas import BuyRequest, EquipRequest, EquippedSchema, ShopResponse
from app.services.shop_service import buy_item, equip_item

router = APIRouter(prefix="/shop", tags=["shop"])


@router.post("/buy", response_model=ShopResponse)
async def buy(req: BuyRequest, player_id: str = Depends(get_current_player)):
    db = await get_db()
    try:
        wallet, owned, equipped = await buy_item(db, player_id, req.category, req.itemId)
    except ValueError as e:
        raise HTTPException(400, str(e))
    return ShopResponse(wallet=wallet, owned=owned, equipped=equipped)


@router.put("/equip", response_model=EquippedSchema)
async def equip(req: EquipRequest, player_id: str = Depends(get_current_player)):
    db = await get_db()
    try:
        equipped = await equip_item(db, player_id, req.category, req.itemId)
    except ValueError as e:
        raise HTTPException(400, str(e))
    return equipped
