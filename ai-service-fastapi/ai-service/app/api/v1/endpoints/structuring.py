import json

from fastapi import APIRouter, Depends, HTTPException

from app.core.security import verify_internal_key
from app.schemas.cv import StructuredCV, StructuringRequest
from app.services.llm.groq_provider import GroqProvider, get_groq_provider

router = APIRouter()

SYSTEM_PROMPT = """You are a CV parsing engine. Given raw text extracted from a CV/resume,
extract structured information and return ONLY valid JSON matching this schema:
{
  "full_name": string or null,
  "email": string or null,
  "phone": string or null,
  "skills": [string],
  "experience": [{"title": string, "company": string, "duration": string or null, "description": string or null}],
  "education": [{"degree": string, "institution": string, "year": string or null}],
  "languages": [string],
  "summary": string or null
}
No prose, no markdown fences — JSON only."""


@router.post("/cv", response_model=StructuredCV, dependencies=[Depends(verify_internal_key)])
async def structure_cv(
    payload: StructuringRequest,
    llm: GroqProvider = Depends(get_groq_provider),
) -> StructuredCV:
    raw = await llm.complete(prompt=payload.text, system=SYSTEM_PROMPT, json_mode=True)

    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        raise HTTPException(status_code=502, detail="LLM did not return valid JSON")

    return StructuredCV(**data)
