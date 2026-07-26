from functools import lru_cache

from sentence_transformers import SentenceTransformer

from app.core.config import settings


@lru_cache(maxsize=1)
def get_embedding_model() -> SentenceTransformer:
    """
    Loaded once per process (lru_cache) and kept in memory —
    reloading a ~1.2GB model per request would be catastrophic for latency.
    Explicitly forced to CPU: on a 4GB GTX 1650 this has no business
    competing with anything else for VRAM.
    """
    return SentenceTransformer(settings.embedding_model, device="cpu")


def embed_text(text: str) -> list[float]:
    model = get_embedding_model()
    vector = model.encode(text, normalize_embeddings=True)
    return vector.tolist()
