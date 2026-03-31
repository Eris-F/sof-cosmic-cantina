from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import CORS_ORIGINS
from app.database import close_db, init_db
from app.routes import auth_routes, players, shop, skills, scores, achievements, sync


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield
    await close_db()


app = FastAPI(title="Sofia's Cosmic Cantina API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_routes.router)
app.include_router(players.router)
app.include_router(shop.router)
app.include_router(skills.router)
app.include_router(scores.router)
app.include_router(achievements.router)
app.include_router(sync.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
