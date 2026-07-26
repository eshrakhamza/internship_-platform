from pydantic import BaseModel


class TextInput(BaseModel):
    text: str


class EmbeddingResponse(BaseModel):
    vector: list[float]
    dimensions: int
