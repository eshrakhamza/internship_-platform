# app/main.py
import os
from dotenv import load_dotenv

# Explicitly load from the same folder as this file
env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
env_path = os.path.abspath(env_path)
load_dotenv(dotenv_path=env_path)

# Debug: confirm it loaded
print(f"[DEBUG] .env path: {env_path}")
print(f"[DEBUG] INTERNAL_API_KEY: '{os.getenv('INTERNAL_API_KEY')}'")

from fastapi import FastAPI
from app.api.v1.router import api_router
from app.services.embeddings.bge_provider import get_embedding_model
import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Internship Platform AI Service",
    description="Internal AI microservice — not exposed to the public internet, only callable by NestJS.",
    version="0.1.0",
)

app.include_router(api_router, prefix="/api/v1")


@app.on_event("startup")
async def preload_models():
    logger.info("Preloading embedding model (bge-m3)... this may take 30-60s on first run")
    get_embedding_model()  # forces the model to load once, at boot, not on first request
    logger.info("Embedding model loaded and cached.")


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}