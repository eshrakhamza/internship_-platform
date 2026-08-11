import json
import logging
import re
from fastapi import APIRouter, Header, HTTPException, Depends
from app.schemas.questions import QuestionGenerationRequest, QuestionGenerationResponse, QuestionOut

from app.core.security import verify_internal_key

from app.services.llm.groq_provider import get_groq_provider
from app.services.llm.gemini_provider import get_gemini_provider

router = APIRouter(tags=["questions"])
logger = logging.getLogger(__name__)







PROMPT_TEMPLATE = """You are generating a technical assessment for candidates applying to a "{theme}" internship, difficulty level: {difficulty}.

Generate exactly {mcq_count} multiple-choice questions and {open_count} open-ended questions.

Rules:
- Questions must be specific and technical, not generic ("what is X") filler.
- Each MCQ has exactly 4 options, exactly one marked isCorrect: true.
- Each question includes a short explanation (what a good answer covers, for MCQ: why the correct option is right).
- For OPEN questions, also include an "expectedAnswer": 2-4 sentences describing what a strong answer should cover — used later to grade candidate submissions, so be specific.
- Difficulty {difficulty} should be reflected in question depth.
- Return ONLY valid JSON, no markdown fences, no preamble, matching this exact shape:

{{
  "questions": [
    {{
      "type": "MCQ",
      "questionText": "...",
      "explanation": "...",
      "options": [
        {{"optionText": "...", "isCorrect": true}},
        {{"optionText": "...", "isCorrect": false}},
        {{"optionText": "...", "isCorrect": false}},
        {{"optionText": "...", "isCorrect": false}}
      ]
    }},
    {{
      "type": "OPEN",
      "questionText": "...",
      "explanation": "...",
      "expectedAnswer": "..."
    }}
  ]
}}
"""

def _build_prompt(req: QuestionGenerationRequest) -> str:
    return PROMPT_TEMPLATE.format(
        theme=req.theme,
        difficulty=req.difficulty,
        mcq_count=req.mcq_count,   # was req.mcqCount
        open_count=req.open_count, # was req.openCount
    )


def _clean_json(raw_text: str) -> str:
    """Strip markdown fences and any preamble/postamble."""
    text = raw_text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.IGNORECASE)
        text = re.sub(r"\s*```$", "", text)
    return text.strip()


def _parse_questions(raw_text: str) -> list[QuestionOut]:
    cleaned = _clean_json(raw_text)
    data = json.loads(cleaned)
    if "questions" not in data:
        raise ValueError("Missing 'questions' key in JSON response")
    return [QuestionOut(**q) for q in data["questions"]]


@router.post(
    "/generate",
    response_model=QuestionGenerationResponse,
    dependencies=[Depends(verify_internal_key)],
)
async def generate_questions(req: QuestionGenerationRequest):
    prompt = _build_prompt(req)

    # Primary: Groq
    try:
        groq = get_groq_provider()
        raw = await groq.complete(prompt=prompt, json_mode=True)
        questions = _parse_questions(raw)
        return QuestionGenerationResponse(questions=questions, source="groq")
    except Exception as e:
        logger.warning(f"Groq question generation failed, falling back to Gemini: {e}")

    # Fallback: Gemini
    try:
        gemini = get_gemini_provider()
        raw = await gemini.complete(prompt=prompt, json_mode=True)
        questions = _parse_questions(raw)
        return QuestionGenerationResponse(questions=questions, source="gemini")
    except Exception as e:
        logger.error(f"Gemini question generation also failed: {e}")
        raise HTTPException(
            status_code=502,
            detail="AI question generation failed on both providers",
        )