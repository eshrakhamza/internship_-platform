import json

from fastapi import APIRouter, Depends, HTTPException

from app.core.security import verify_internal_key
from app.schemas.cv import GradingRequest, GradingResponse
from app.services.llm.groq_provider import GroqProvider, get_groq_provider

router = APIRouter()

SYSTEM_PROMPT = """You are grading a candidate's answer to a technical/screening question.
Return ONLY valid JSON: {"score": float (0-10), "feedback": string (1-2 sentences)}.
Be consistent and fair; use the rubric if provided."""


@router.post("/answer", response_model=GradingResponse, dependencies=[Depends(verify_internal_key)])
async def grade_answer(
    payload: GradingRequest,
    llm: GroqProvider = Depends(get_groq_provider),
) -> GradingResponse:
    prompt = (
        f"Question: {payload.question}\n"
        f"Expected answer: {payload.expected_answer}\n"
        f"Candidate answer: {payload.candidate_answer}\n"
        f"Rubric: {payload.rubric or 'none provided, use general judgement'}"
    )
    raw = await llm.complete(prompt=prompt, system=SYSTEM_PROMPT, json_mode=True)

    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        raise HTTPException(status_code=502, detail="LLM did not return valid JSON")

    return GradingResponse(**data)
