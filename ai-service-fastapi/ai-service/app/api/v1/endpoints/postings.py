from fastapi import APIRouter, HTTPException, Header, Depends
from app.schemas.postings import PostingGenerateRequest, PostingGenerateResponse
from app.services.llm.groq_provider import GroqProvider, get_groq_provider
from app.services.llm.gemini_provider import GeminiProvider, get_gemini_provider
import json
import os

router = APIRouter()

INTERNAL_API_KEY = os.getenv("INTERNAL_API_KEY")

SYSTEM_PROMPT = """You are an expert technical recruiter assistant...

Return ONLY valid JSON matching this schema:
{
  "description": "string — 4 sections separated by \\n\\n: 1) About the role (2-3 sentences on day-to-day work), 2) Key responsibilities (3-4 bullet points using markdown '- '), 3) What you'll learn (2 sentences), 4) About the team (1 sentence)",
  "required_skills": ["string", ...],
  "preferred_skills": ["string", ...]
}

Rules:
- description must be professional, bilingual-friendly, no filler like 'exciting projects' or 'dynamic team'
- required_skills: hard requirements only
- preferred_skills: nice-to-haves inferred from context
- Do not invent company details not in the input
"""

def build_user_prompt(req: PostingGenerateRequest) -> str:
    parts = [f"Title: {req.title}"]
    if req.seniority:
        parts.append(f"Seniority: {req.seniority}")
    if req.department:
        parts.append(f"Department: {req.department}")
    parts.append(f"Recruiter's notes:\n{req.rough_input}")
    return "\n".join(parts)

@router.post("/generate", response_model=PostingGenerateResponse)
async def generate_posting(
    req: PostingGenerateRequest,
    x_internal_api_key: str = Header(...),
    groq: GroqProvider = Depends(get_groq_provider),
    gemini: GeminiProvider = Depends(get_gemini_provider),
):
    if x_internal_api_key != INTERNAL_API_KEY:
        raise HTTPException(status_code=401, detail="Invalid internal API key")

    user_prompt = build_user_prompt(req)
    model_used = "groq-llama-3.3-70b"

    try:
        raw = await groq.complete(prompt=user_prompt, system=SYSTEM_PROMPT, json_mode=True)
    except Exception as e:
        try:
            raw = await gemini.complete(prompt=user_prompt, system=SYSTEM_PROMPT, json_mode=True)
            model_used = "gemini-2.5-flash"
        except Exception as e2:
            raise HTTPException(status_code=502, detail=f"Both LLM providers failed: {e2}")

    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        raise HTTPException(status_code=502, detail="LLM returned invalid JSON")

    return PostingGenerateResponse(
        title=req.title,
        description=parsed["description"],
        required_skills=parsed["required_skills"],
        preferred_skills=parsed["preferred_skills"],
        model_used=model_used,
    )