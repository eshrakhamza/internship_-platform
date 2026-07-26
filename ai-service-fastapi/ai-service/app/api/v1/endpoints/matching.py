from fastapi import APIRouter, Depends

from app.core.security import verify_internal_key
from app.schemas.cv import MatchExplanationRequest, MatchExplanationResponse
from app.services.llm.groq_provider import GroqProvider, get_groq_provider

router = APIRouter()

SYSTEM_PROMPT = """You explain why a candidate's CV matches a job posting, given a
precomputed similarity score. Be concrete: reference specific skills or experience
from the CV that align with the job description. 2-3 sentences, no fluff."""


@router.post("/explain", response_model=MatchExplanationResponse, dependencies=[Depends(verify_internal_key)])
async def explain_match(
    payload: MatchExplanationRequest,
    llm: GroqProvider = Depends(get_groq_provider),
) -> MatchExplanationResponse:
    prompt = (
        f"CV summary: {payload.cv_summary}\n\n"
        f"Job description: {payload.job_description}\n\n"
        f"Similarity score: {payload.similarity_score:.2f}\n\n"
        "Explain why this is (or isn't) a good match."
    )
    explanation = await llm.complete(prompt=prompt, system=SYSTEM_PROMPT)
    return MatchExplanationResponse(explanation=explanation)
