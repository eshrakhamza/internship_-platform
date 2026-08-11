# schemas/postings.py
from pydantic import BaseModel, Field
from typing import List

class PostingGenerateRequest(BaseModel):
    title: str
    rough_input: str = Field(..., description="Recruiter's raw notes, bullet points, or loose description")
    seniority: str | None = None  # e.g. "internship", "junior", "senior"
    department: str | None = None

class PostingGenerateResponse(BaseModel):
    title: str
    description: str
    required_skills: List[str]
    preferred_skills: List[str]
    model_used: str  # "groq-llama-3.3-70b" or "gemini-2.5-flash" — useful for debugging/logging