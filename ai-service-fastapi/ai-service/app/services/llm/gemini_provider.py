from google import genai

from app.core.config import settings
from app.services.llm.base import LLMProvider


class GeminiProvider(LLMProvider):
    """
    Fallback for when Groq is rate-limited or down, and the go-to for
    vision tasks (scanned/complex-layout CVs) — deliberately not
    self-hosting a local VLM given the disk constraint.
    """

    def __init__(self) -> None:
        self._client = genai.Client(api_key=settings.gemini_api_key)
        self._model = settings.gemini_model

    async def complete(
        self,
        prompt: str,
        system: str | None = None,
        json_mode: bool = False,
    ) -> str:
        full_prompt = f"{system}\n\n{prompt}" if system else prompt
        response = await self._client.aio.models.generate_content(
            model=self._model,
            contents=full_prompt,
            config={"response_mime_type": "application/json"} if json_mode else None,
        )
        return response.text


def get_gemini_provider() -> GeminiProvider:
    return GeminiProvider()
