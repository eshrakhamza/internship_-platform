# app/schemas/assessment.py
from pydantic import BaseModel, Field
from typing import List, Optional, Literal

class MCQOptionOut(BaseModel):
    optionText: str
    isCorrect: bool

class QuestionOut(BaseModel):
    type: Literal["MCQ", "OPEN"]
    questionText: str
    explanation: Optional[str] = None
    options: Optional[List[MCQOptionOut]] = None

class QuestionGenerationRequest(BaseModel):
    theme: str
    difficulty: Literal["BEGINNER", "INTERMEDIATE", "ADVANCED"]
    mcqCount: int = Field(default=5, ge=0, le=15)
    openCount: int = Field(default=2, ge=0, le=5)

class QuestionGenerationResponse(BaseModel):
    questions: List[QuestionOut]
    source: Literal["groq", "gemini", "fallback"]