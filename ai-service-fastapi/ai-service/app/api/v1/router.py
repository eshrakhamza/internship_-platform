from fastapi import APIRouter

from app.api.v1.endpoints import (
    embeddings,
    extraction,
    grading,
    linkedin,
    matching,
    scheduling,
    structuring,
)

api_router = APIRouter()

api_router.include_router(extraction.router, prefix="/extraction", tags=["extraction"])
api_router.include_router(embeddings.router, prefix="/embeddings", tags=["embeddings"])
api_router.include_router(structuring.router, prefix="/structuring", tags=["structuring"])
api_router.include_router(matching.router, prefix="/matching", tags=["matching"])
api_router.include_router(grading.router, prefix="/grading", tags=["grading"])
api_router.include_router(scheduling.router, prefix="/scheduling", tags=["scheduling"])
api_router.include_router(linkedin.router, prefix="/linkedin", tags=["linkedin"])
