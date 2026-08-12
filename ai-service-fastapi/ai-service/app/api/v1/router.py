from fastapi import APIRouter

from app.api.v1.endpoints import (
    analysis,
    embeddings,
    extraction,
    grading,
    linkedin,
    matching,
    scheduling,
    structuring,
    postings,
    assessments, 
    feedback,
)

# ...

api_router = APIRouter()

api_router.include_router(feedback.router,  prefix="/feedback", tags=["feedback"])
api_router.include_router(postings.router, prefix="/postings", tags=["postings"])  # <-- router (not routes), and fix spacing
api_router.include_router(analysis.router, prefix="/analysis", tags=["analysis"])
api_router.include_router(extraction.router, prefix="/extraction", tags=["extraction"])
api_router.include_router(embeddings.router, prefix="/embeddings", tags=["embeddings"])
api_router.include_router(structuring.router, prefix="/structuring", tags=["structuring"])
api_router.include_router(matching.router, prefix="/matching", tags=["matching"])
api_router.include_router(grading.router, prefix="/grading", tags=["grading"])
api_router.include_router(scheduling.router, prefix="/scheduling", tags=["scheduling"])
api_router.include_router(linkedin.router, prefix="/linkedin", tags=["linkedin"])
api_router.include_router(assessments.router, prefix="/questions", tags=["questions"])