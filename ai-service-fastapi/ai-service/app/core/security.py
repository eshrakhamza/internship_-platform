from fastapi import Header, HTTPException, status

from app.core.config import settings


async def verify_internal_key(x_internal_key: str = Header(...)) -> None:
    """
    Dependency that every route includes to make sure only NestJS
    (which holds the shared secret) can call this service — it should
    never be reachable from the public internet directly.
    """
    if x_internal_key != settings.internal_api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing internal API key",
        )
