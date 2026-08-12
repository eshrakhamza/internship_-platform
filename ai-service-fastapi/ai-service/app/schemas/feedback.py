from pydantic import BaseModel
from typing import List, Optional


class AttemptAnswerSummary(BaseModel):
    question: str
    answer: str
    is_correct: Optional[bool] = None
    score: Optional[int] = None


class AttemptFeedbackRequest(BaseModel):
    assessment_title: str
    theme: str
    mcq_score: int
    open_score: int
    total_score: int
    answers: List[AttemptAnswerSummary]


class AttemptFeedbackResponse(BaseModel):
    strengths: List[str]
    weaknesses: List[str]
    recommendations: List[str]
    source: str = "groq"