import aiosqlite
from datetime import datetime, timezone

from app.models.schemas import EquippedSchema, OwnedSchema, WalletSchema

# Price catalog — single source of truth for the server.
# Category -> item_id -> price.  Mirrors the frontend shop.js catalog.
ITEM_PRICES: dict[str, dict[str, int]] = {
    "skins": {
        "default": 0, "tuxedo": 200, "calico": 350, "smiski_glow": 500,
        "jedi": 800, "sith": 800, "tequila_cat": 1200, "fred_cat": 1500,
        "rainbow": 2000, "diving_cat": 1000, "ski_cat": 1000, "photo_cat": 1200,
        "dice_master": 1800, "jellycat_cat": 2500, "bread_cat": 3000, "star_cat": 3500,
    },
    "bullets": {
        "bread": 0, "croissant": 200, "baguette": 400, "pretzel": 600,
        "lime": 800, "salt_shot": 1000, "blaster": 1200, "lightsaber": 1500,
        "flash": 1800, "tulip_toss": 2200, "bass_drop": 3000,
    },
    "trails": {
        "none": 0, "sparkle": 150, "hearts": 300, "stars": 500,
        "bubbles": 800, "fire": 1200, "dice_trail": 1500, "soundwave": 2000,
        "hyperspace": 2500,
    },
    "barriers": {
        "flowers": 0, "tulips_plus": 200, "lily_wall": 400, "ice_wall": 600,
        "fire_wall": 800, "star_shield": 1000, "dice_wall": 1300,
        "bass_barrier": 1600, "jelly_shield": 1800, "photo_booth": 2000,
    },
}

VALID_CATEGORIES = {"skins", "bullets", "trails", "barriers"}


async def buy_item(
    db: aiosqlite.Connection,
    player_id: str,
    category: str,
    item_id: str,
) -> tuple[WalletSchema, OwnedSchema, EquippedSchema]:
    if category not in VALID_CATEGORIES:
        raise ValueError(f"Invalid category: {category}")

    catalog = ITEM_PRICES.get(category, {})
    price = catalog.get(item_id)
    if price is None:
        raise ValueError(f"Unknown item: {category}/{item_id}")

    # Check not already owned
    rows = await db.execute_fetchall(
        "SELECT 1 FROM owned_items WHERE player_id = ? AND category = ? AND item_id = ?",
        (player_id, category, item_id),
    )
    if rows:
        raise ValueError("Item already owned")

    # Check balance
    wallet_rows = await db.execute_fetchall(
        "SELECT coins FROM players WHERE id = ?", (player_id,)
    )
    coins = wallet_rows[0]["coins"]
    if coins < price:
        raise ValueError("Not enough coins")

    # Deduct and add
    await db.execute(
        "UPDATE players SET coins = coins - ?, updated_at = ? WHERE id = ?",
        (price, datetime.now(timezone.utc).isoformat(), player_id),
    )
    await db.execute(
        "INSERT INTO owned_items (player_id, category, item_id) VALUES (?, ?, ?)",
        (player_id, category, item_id),
    )

    # Auto-equip on purchase
    await db.execute(
        "INSERT OR REPLACE INTO equipped_items (player_id, category, item_id) VALUES (?, ?, ?)",
        (player_id, category, item_id),
    )
    await db.commit()

    # Return updated state
    from app.services.player_service import _get_equipped, _get_owned, _get_wallet
    wallet = await _get_wallet(db, player_id)
    owned = await _get_owned(db, player_id)
    equipped = await _get_equipped(db, player_id)
    return wallet, owned, equipped


async def equip_item(
    db: aiosqlite.Connection,
    player_id: str,
    category: str,
    item_id: str,
) -> EquippedSchema:
    if category not in VALID_CATEGORIES:
        raise ValueError(f"Invalid category: {category}")

    # Verify ownership
    rows = await db.execute_fetchall(
        "SELECT 1 FROM owned_items WHERE player_id = ? AND category = ? AND item_id = ?",
        (player_id, category, item_id),
    )
    if not rows:
        raise ValueError("Item not owned")

    await db.execute(
        "INSERT OR REPLACE INTO equipped_items (player_id, category, item_id) VALUES (?, ?, ?)",
        (player_id, category, item_id),
    )
    await db.commit()

    from app.services.player_service import _get_equipped
    return await _get_equipped(db, player_id)
