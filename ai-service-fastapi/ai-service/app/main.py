from fastapi import FastAPI

from app.api.v1.router import api_router

app = FastAPI(
    title="Internship Platform AI Service",
    description="Internal AI microservice — not exposed to the public internet, only callable by NestJS.",
    version="0.1.0",
)

app.include_router(api_router, prefix="/api/v1")


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}
