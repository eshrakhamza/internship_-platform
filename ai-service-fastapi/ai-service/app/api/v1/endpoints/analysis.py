import json
import logging

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.core.security import verify_internal_key
from app.services.llm.groq_provider import GroqProvider, get_groq_provider

logger = logging.getLogger("ai_service.analyze")

router = APIRouter()


class AnalysisRequest(BaseModel):
    prompt: str
    system: str | None = None


class AnalysisResponse(BaseModel):
    text: str


@router.post("/generate", response_model=AnalysisResponse, dependencies=[Depends(verify_internal_key)])
async def generate_analysis(
    payload: AnalysisRequest,
    llm: GroqProvider = Depends(get_groq_provider),
) -> AnalysisResponse:
    text = await llm.complete(prompt=payload.prompt, system=payload.system, json_mode=False)
    return AnalysisResponse(text=text)


VALID_THEMES = [
    "ARTIFICIAL_INTELLIGENCE",
    "CYBERSECURITY",
    "DEVOPS",
    "DATA_SCIENCE",
    "FULL_STACK",
    "CLOUD_COMPUTING",
    "SOFTWARE_ENGINEERING",
]

APPLICATION_SYSTEM_PROMPT = f"""You evaluate internship applications, combining the candidate's CV
(actual skills/experience/education) with their written application answers. Weigh both —
a candidate's CV evidence should meaningfully affect the theme classification and score,
not just their stated preference.

Do not use gendered pronouns (he/she/his/her) — refer to the candidate by name or as
"the candidate".

Return ONLY valid JSON, no markdown fences, matching exactly:
{{
  "summary": "2-3 sentence summary combining CV and application evidence",
  "theme": "one of: {', '.join(VALID_THEMES)}",
  "score": integer from 0 to 100,
  "explanation": "1-2 sentences justifying the score, citing specific CV or answer evidence"
}}"""


class ApplicationAnalysisRequest(BaseModel):
    candidate_name: str
    school: str | None = None
    academic_level: str | None = None
    preferred_theme: str | None = None
    answers: list[str]
    cv_summary: str | None = None
    cv_skills: list[str] = []
    cv_experience: list[dict] = []
    cv_education: list[dict] = []
    cv_projects: list[dict] = []


class ApplicationAnalysisResponse(BaseModel):
    summary: str
    theme: str
    score: int
    explanation: str


@router.post(
    "/application",
    response_model=ApplicationAnalysisResponse,
    dependencies=[Depends(verify_internal_key)],
)
async def analyze_application(
    payload: ApplicationAnalysisRequest,
    llm: GroqProvider = Depends(get_groq_provider),
) -> ApplicationAnalysisResponse:
    # --- LOG 1: what NestJS actually sent us ---
    logger.info(
        "analyze_application received payload: candidate=%s cv_summary=%r cv_skills=%r "
        "cv_experience=%r cv_projects=%r cv_education=%r answers_count=%d",
        payload.candidate_name,
        payload.cv_summary,
        payload.cv_skills,
        payload.cv_experience,
        payload.cv_projects,
        payload.cv_education,
        len(payload.answers),
    )

    answers_block = "\n".join(f"{i + 1}. {a}" for i, a in enumerate(payload.answers))

    cv_block = "No CV data available."
    if payload.cv_summary or payload.cv_skills or payload.cv_experience or payload.cv_projects:
        cv_lines = []
        if payload.cv_summary:
            cv_lines.append(f"CV Summary: {payload.cv_summary}")
        if payload.cv_skills:
            cv_lines.append(f"Skills: {', '.join(payload.cv_skills)}")
        if payload.cv_experience:
            exp_str = "; ".join(
                f"{e.get('title', '')} at {e.get('company', '')}" for e in payload.cv_experience
            )
            cv_lines.append(f"Experience: {exp_str}")
        if payload.cv_projects:
            proj_lines = []
            for p in payload.cv_projects:
                line = f"{p.get('name', '')}"
                if p.get('description'):
                    line += f": {p['description']}"
                if p.get('technologies'):
                    line += f" [Tech: {', '.join(p['technologies'])}]"
                proj_lines.append(line)
            cv_lines.append("Projects:\n" + "\n".join(proj_lines))
        if payload.cv_education:
            edu_str = "; ".join(
                f"{e.get('degree', '')} - {e.get('institution', '')}" for e in payload.cv_education
            )
            cv_lines.append(f"Education: {edu_str}")
        cv_block = "\n".join(cv_lines)

    # --- LOG 2: whether CV data actually made it into the prompt ---
    logger.info("cv_block used in prompt:\n%s", cv_block)
    if cv_block == "No CV data available.":
        logger.warning(
            "No CV data was provided for candidate=%s — NestJS likely didn't pass "
            "cv_summary/cv_skills/cv_experience. Analysis will be generic.",
            payload.candidate_name,
        )

    prompt = f"""Candidate: {payload.candidate_name}
School: {payload.school or 'Not provided'}
Academic Level: {payload.academic_level or 'Not provided'}
Preferred Theme: {payload.preferred_theme or 'Not specified'}

--- CV Data ---
{cv_block}

--- Application Answers ---
{answers_block}"""

    # --- LOG 3: full prompt sent to the LLM ---
    logger.info("Full prompt sent to Groq:\n%s", prompt)

    raw = await llm.complete(prompt=prompt, system=APPLICATION_SYSTEM_PROMPT, json_mode=True)

    # --- LOG 4: raw LLM response before parsing ---
    logger.info("Raw LLM response:\n%s", raw)

    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        logger.error("LLM did not return valid JSON. Raw output was:\n%s", raw)
        raise HTTPException(status_code=502, detail="LLM did not return valid JSON")

    data["score"] = max(0, min(100, int(data.get("score", 70))))
    if data.get("theme") not in VALID_THEMES:
        data["theme"] = payload.preferred_theme if payload.preferred_theme in VALID_THEMES else "FULL_STACK"

    return ApplicationAnalysisResponse(**data)