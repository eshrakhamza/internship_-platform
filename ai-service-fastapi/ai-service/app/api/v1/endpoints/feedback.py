import json
import logging
from fastapi import APIRouter, Depends, HTTPException

from app.core.security import verify_internal_key
from app.schemas.feedback import AttemptFeedbackRequest, AttemptFeedbackResponse
from app.services.llm.groq_provider import GroqProvider, get_groq_provider
from app.services.llm.gemini_provider import get_gemini_provider

router = APIRouter()
logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are a technical assessment reviewer. Given a candidate's assessment
performance (scores + individual question answers), identify concrete strengths, weaknesses,
and recommendations grounded in what they actually wrote or selected.
Return ONLY valid JSON, no markdown fences, matching this exact shape:
{"strengths": ["...", "..."], "weaknesses": ["...", "..."], "recommendations": ["...", "..."]}
2-4 short, specific items per list. Avoid generic filler — reference the actual topics covered."""


@router.post(
    "/attempt",
    response_model=AttemptFeedbackResponse,
    dependencies=[Depends(verify_internal_key)],
)
async def generate_attempt_feedback(
    payload: AttemptFeedbackRequest,
    llm: GroqProvider = Depends(get_groq_provider),
) -> AttemptFeedbackResponse:
    answers_block = "\n".join(
        f"- Q: {a.question}\n  A: {a.answer}"
        + (f"\n  Correct: {a.is_correct}" if a.is_correct is not None else "")
        + (f"\n  Score: {a.score}/100" if a.score is not None else "")
        for a in payload.answers
    )
    prompt = (
        f"Assessment: {payload.assessment_title} (theme: {payload.theme})\n"
        f"Scores — MCQ: {payload.mcq_score}%, Open: {payload.open_score}%, Total: {payload.total_score}%\n\n"
        f"Answers:\n{answers_block}\n\n"
        "Generate feedback."
    )

    try:
        raw = await llm.complete(prompt=prompt, system=SYSTEM_PROMPT, json_mode=True)
        data = json.loads(raw)
        return AttemptFeedbackResponse(**data, source="groq")
    except Exception as e:
        logger.warning(f"Groq feedback failed, falling back to Gemini: {e}")

    try:
        gemini = get_gemini_provider()
        raw = await gemini.complete(prompt=prompt, system=SYSTEM_PROMPT, json_mode=True)
        data = json.loads(raw)
        return AttemptFeedbackResponse(**data, source="gemini")
    except Exception as e:
        logger.error(f"Gemini feedback also failed: {e}")
        raise HTTPException(status_code=502, detail="AI feedback generation failed on both providers")