from fastapi import APIRouter, Depends

from app.core.security import verify_internal_key
from app.schemas.common import EmbeddingResponse, TextInput
from app.services.embeddings.bge_provider import embed_text

router = APIRouter()


@router.post("/generate", response_model=EmbeddingResponse, dependencies=[Depends(verify_internal_key)])
async def generate_embedding(payload: TextInput) -> EmbeddingResponse:
    vector = embed_text(payload.text)
    return EmbeddingResponse(vector=vector, dimensions=len(vector))
