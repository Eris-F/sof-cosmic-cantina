import hashlib
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException

from google.oauth2.id_token import verify_oauth2_token
from google.auth.transport.requests import Request as GoogleRequest

from app.auth import (
    create_access_token,
    create_refresh_token,
    hash_password,
    verify_password,
)
from app.config import GOOGLE_CLIENT_ID
from app.database import get_db
from app.models.schemas import (
    AuthResponse,
    GoogleAuthRequest,
    LoginRequest,
    PlayerInfo,
    RefreshRequest,
    RegisterRequest,
    TokenResponse,
)
from app.services.player_service import create_player, get_player_info

router = APIRouter(prefix="/auth", tags=["auth"])


async def _issue_tokens(db, player_id: str) -> tuple[str, str]:
    access = create_access_token(player_id)
    raw_refresh, token_hash, expires_at = create_refresh_token(player_id)
    token_id = uuid.uuid4().hex
    now = datetime.now(timezone.utc).isoformat()
    await db.execute(
        "INSERT INTO refresh_tokens (id, player_id, token_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?)",
        (token_id, player_id, token_hash, expires_at.isoformat(), now),
    )
    await db.commit()
    return access, raw_refresh


@router.post("/register", response_model=AuthResponse)
async def register(req: RegisterRequest):
    db = await get_db()

    # Check duplicate email
    rows = await db.execute_fetchall(
        "SELECT id FROM players WHERE email = ?", (req.email,)
    )
    if rows:
        raise HTTPException(409, "Email already registered")

    if len(req.password) < 6:
        raise HTTPException(422, "Password must be at least 6 characters")

    pw_hash = hash_password(req.password)
    player_id = await create_player(
        db, req.email, req.username, pw_hash, None, "email"
    )

    access, refresh = await _issue_tokens(db, player_id)
    info = await get_player_info(db, player_id)
    return AuthResponse(access_token=access, refresh_token=refresh, player=info)


@router.post("/login", response_model=AuthResponse)
async def login(req: LoginRequest):
    db = await get_db()
    rows = await db.execute_fetchall(
        "SELECT id, password_hash FROM players WHERE email = ?", (req.email,)
    )
    if not rows:
        raise HTTPException(401, "Invalid credentials")

    row = rows[0]
    if not row["password_hash"]:
        raise HTTPException(401, "Account uses Google sign-in")

    if not verify_password(req.password, row["password_hash"]):
        raise HTTPException(401, "Invalid credentials")

    player_id = row["id"]
    access, refresh = await _issue_tokens(db, player_id)
    info = await get_player_info(db, player_id)
    return AuthResponse(access_token=access, refresh_token=refresh, player=info)


@router.post("/google", response_model=AuthResponse)
async def google_auth(req: GoogleAuthRequest):
    # Verify the Google ID token
    try:
        idinfo = verify_oauth2_token(
            req.id_token, GoogleRequest(), GOOGLE_CLIENT_ID
        )
    except ValueError:
        raise HTTPException(401, "Invalid Google token")

    google_id = idinfo["sub"]
    email = idinfo.get("email", "")
    name = idinfo.get("name", email.split("@")[0])

    db = await get_db()

    # Check if Google account already linked
    rows = await db.execute_fetchall(
        "SELECT id FROM players WHERE google_id = ?", (google_id,)
    )
    if rows:
        player_id = rows[0]["id"]
    else:
        # Check if email exists (link Google to existing email account)
        rows = await db.execute_fetchall(
            "SELECT id FROM players WHERE email = ?", (email,)
        )
        if rows:
            player_id = rows[0]["id"]
            await db.execute(
                "UPDATE players SET google_id = ?, auth_provider = 'google' WHERE id = ?",
                (google_id, player_id),
            )
            await db.commit()
        else:
            # New player via Google
            player_id = await create_player(
                db, email, name[:20], None, google_id, "google"
            )

    access, refresh = await _issue_tokens(db, player_id)
    info = await get_player_info(db, player_id)
    return AuthResponse(access_token=access, refresh_token=refresh, player=info)


@router.post("/refresh", response_model=TokenResponse)
async def refresh(req: RefreshRequest):
    db = await get_db()
    token_hash = hashlib.sha256(req.refresh_token.encode()).hexdigest()

    rows = await db.execute_fetchall(
        "SELECT id, player_id, expires_at FROM refresh_tokens WHERE token_hash = ?",
        (token_hash,),
    )
    if not rows:
        raise HTTPException(401, "Invalid refresh token")

    row = rows[0]
    if datetime.fromisoformat(row["expires_at"]) < datetime.now(timezone.utc):
        await db.execute("DELETE FROM refresh_tokens WHERE id = ?", (row["id"],))
        await db.commit()
        raise HTTPException(401, "Refresh token expired")

    access = create_access_token(row["player_id"])
    return TokenResponse(access_token=access)


@router.post("/logout", status_code=204)
async def logout(req: RefreshRequest):
    db = await get_db()
    token_hash = hashlib.sha256(req.refresh_token.encode()).hexdigest()
    await db.execute("DELETE FROM refresh_tokens WHERE token_hash = ?", (token_hash,))
    await db.commit()
