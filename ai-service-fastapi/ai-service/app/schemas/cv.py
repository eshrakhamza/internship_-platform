from pydantic import BaseModel


class ExtractionResponse(BaseModel):
    text: str
    method: str  # "text_layer" or "ocr"
    page_count: int


class Experience(BaseModel):
    title: str
    company: str
    duration: str | None = None
    description: str | None = None


class Education(BaseModel):
    degree: str
    institution: str
    year: str | None = None



class StructuringRequest(BaseModel):
    text: str


class MatchExplanationRequest(BaseModel):
    cv_summary: str
    job_description: str
    similarity_score: float


class MatchExplanationResponse(BaseModel):
    explanation: str


class GradingRequest(BaseModel):
    question: str
    expected_answer: str
    candidate_answer: str
    rubric: str | None = None


class GradingResponse(BaseModel):
    score: float
    feedback: str


class LinkedInPostRequest(BaseModel):
    achievement_summary: str
    tone: str = "professional"


class LinkedInPostResponse(BaseModel):
    post: str


class Project(BaseModel):
    name: str
    period: str | None = None
    description: str | None = None
    technologies: list[str] = []


class StructuredCV(BaseModel):
    full_name: str | None = None
    email: str | None = None
    phone: str | None = None
    skills: list[str] = []
    experience: list[Experience] = []
    projects: list[Project] = []
    education: list[Education] = []
    languages: list[str] = []
    summary: str | None = None