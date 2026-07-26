from abc import ABC, abstractmethod


class LLMProvider(ABC):
    """
    Common interface for any LLM backend (Groq, Gemini, or a future
    local/self-hosted option). Endpoints depend on this interface,
    not on a specific provider — swapping Groq for Gemini as primary
    later means changing one line in the dependency wiring, not the
    endpoint code.
    """

    @abstractmethod
    async def complete(
        self,
        prompt: str,
        system: str | None = None,
        json_mode: bool = False,
    ) -> str:
        """Returns the raw text completion (already-parsed JSON string if json_mode)."""
        ...
