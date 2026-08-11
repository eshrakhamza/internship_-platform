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
  "projects": [{"name": string, "period": string or null, "description": string, "technologies": [string]}],
  "education": [{"degree": string, "institution": string, "year": string or null}],
  "languages": [string],
  "summary": string or null
}

For "summary": write 2-3 sentences YOURSELF synthesizing the candidate's concrete skills,
technologies, and specialization, based on the FULL content of the CV — their skills,
experience, and projects sections. Do NOT copy any existing summary, objective, or
"looking for an internship" line verbatim, even if one appears at the top of the CV,
even if it seems adequate. A generic objective line ("looking for a summer internship")
is NOT an acceptable summary on its own — always ground the summary in specific
technical content actually present elsewhere in the CV (skills, projects, experience).
If the CV genuinely contains no concrete skills/projects/experience at all, set summary to null
rather than returning a generic objective sentence.

Include academic/personal projects (not tied to an employer) under "projects", separate
from professional "experience" (internships/jobs). No prose, no markdown fences — JSON only."""

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
