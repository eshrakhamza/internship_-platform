from fastapi import APIRouter, Depends

from app.core.security import verify_internal_key
from app.schemas.cv import LinkedInPostRequest, LinkedInPostResponse
from app.services.llm.groq_provider import GroqProvider, get_groq_provider

router = APIRouter()

SYSTEM_PROMPT = """You write LinkedIn posts announcing a professional achievement
(new internship, project milestone, certification, etc.). Keep it authentic, not
overly salesy, 3-5 short paragraphs, end with 3-5 relevant hashtags."""


@router.post("/generate", response_model=LinkedInPostResponse, dependencies=[Depends(verify_internal_key)])
async def generate_post(
    payload: LinkedInPostRequest,
    llm: GroqProvider = Depends(get_groq_provider),
) -> LinkedInPostResponse:
    prompt = f"Achievement: {payload.achievement_summary}\nTone: {payload.tone}"
    post = await llm.complete(prompt=prompt, system=SYSTEM_PROMPT)
    return LinkedInPostResponse(post=post)
