import json
import logging
from fastapi import APIRouter, Depends, HTTPException

from app.core.security import verify_internal_key
from app.schemas.grading import GradingRequest, GradingResponse
from app.services.llm.groq_provider import GroqProvider, get_groq_provider
from app.services.llm.gemini_provider import get_gemini_provider

router = APIRouter(tags=["grading"])
logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are a technical interviewer grading a candidate's open-ended answer.
Evaluate based on: accuracy (40%), completeness (35%), and technical depth (25%).
Return ONLY valid JSON, no markdown fences, matching this exact shape:
{"score": <number 0-100>, "feedback": "<2-3 sentences: what was good, what was missing, how to improve>"}
Be fair: partial credit for incomplete but directionally correct answers. A blank or totally irrelevant answer gets 0."""


@router.post(
    "/answer",
    response_model=GradingResponse,
    dependencies=[Depends(verify_internal_key)],
)
async def grade_answer(
    payload: GradingRequest,
    llm: GroqProvider = Depends(get_groq_provider),
) -> GradingResponse:
    prompt = (
        f"Question: {payload.question}\n\n"
        f"Expected points to cover: {payload.expected_answer or 'General technical correctness'}\n\n"
        f"Candidate's answer:\n{payload.candidate_answer}\n\n"
        f"Rubric: {payload.rubric or 'Standard technical assessment'}\n\n"
        "Grade this answer fairly."
    )

    # Primary: Groq
    try:
        raw = await llm.complete(prompt=prompt, system=SYSTEM_PROMPT, json_mode=True)
        data = json.loads(raw)
        return GradingResponse(
            score=max(0, min(100, int(data["score"]))),
            feedback=data["feedback"],
            source="groq",
        )
    except Exception as e:
        logger.warning(f"Groq grading failed, falling back to Gemini: {e}")

    # Fallback: Gemini
    try:
        gemini = get_gemini_provider()
        raw = await gemini.complete(prompt=prompt, system=SYSTEM_PROMPT, json_mode=True)
        data = json.loads(raw)
        return GradingResponse(
            score=max(0, min(100, int(data["score"]))),
            feedback=data["feedback"],
            source="gemini",
        )
    except Exception as e:
        logger.error(f"Gemini grading also failed: {e}")
        raise HTTPException(status_code=502, detail="AI grading failed on both providers")