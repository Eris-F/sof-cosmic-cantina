from pydantic import BaseModel, EmailStr


# --- Auth ---

class RegisterRequest(BaseModel):
    email: EmailStr
    username: str
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class GoogleAuthRequest(BaseModel):
    id_token: str


class RefreshRequest(BaseModel):
    refresh_token: str


class AuthResponse(BaseModel):
    access_token: str
    refresh_token: str
    player: "PlayerInfo"


class TokenResponse(BaseModel):
    access_token: str


class PlayerInfo(BaseModel):
    player_id: str
    email: str
    username: str
    auth_provider: str


# --- Wallet ---

class WalletSchema(BaseModel):
    coins: int = 0
    totalEarned: int = 0


# --- Items ---

class OwnedSchema(BaseModel):
    skins: list[str] = ["default"]
    bullets: list[str] = ["bread"]
    trails: list[str] = ["none"]
    barriers: list[str] = ["flowers"]


class EquippedSchema(BaseModel):
    skins: str = "default"
    bullets: str = "bread"
    trails: str = "none"
    barriers: str = "flowers"


# --- Shop ---

class BuyRequest(BaseModel):
    category: str
    itemId: str


class EquipRequest(BaseModel):
    category: str
    itemId: str


class ShopResponse(BaseModel):
    wallet: WalletSchema
    owned: OwnedSchema
    equipped: EquippedSchema


# --- Skills ---

class SkillsSchema(BaseModel):
    tequila: int = 0
    skiing: int = 0
    diving: int = 0
    photography: int = 0
    music: int = 0


class UpgradeRequest(BaseModel):
    branchId: str


class SkillResponse(BaseModel):
    wallet: WalletSchema
    skills: SkillsSchema


# --- Scores ---

class ScoreSubmitRequest(BaseModel):
    name: str
    score: int
    wave: int
    difficulty: str
    gameMode: str


class HighScoreEntry(BaseModel):
    name: str
    score: int
    wave: int
    difficulty: str
    gameMode: str
    date: str


class ScoresResponse(BaseModel):
    highScores: list[HighScoreEntry]


# --- Achievements ---

class AchievementUnlockRequest(BaseModel):
    achievementIds: list[str]


class AchievementsResponse(BaseModel):
    achievements: list[str]


# --- Full Sync ---

class FullPlayerState(BaseModel):
    wallet: WalletSchema
    owned: OwnedSchema
    equipped: EquippedSchema
    skills: SkillsSchema
    achievements: list[str]
    highScores: list[HighScoreEntry]


class SyncRequest(BaseModel):
    state: FullPlayerState


class SyncResponse(BaseModel):
    player: PlayerInfo
    state: FullPlayerState
