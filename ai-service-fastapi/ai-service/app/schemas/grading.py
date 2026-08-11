from pydantic import BaseModel, Field


class GradingRequest(BaseModel):
    question: str
    candidate_answer: str
    expected_answer: str | None = None
    rubric: str | None = None


class GradingResponse(BaseModel):
    score: int = Field(..., ge=0, le=100)
    feedback: str
    source: str = "groq"