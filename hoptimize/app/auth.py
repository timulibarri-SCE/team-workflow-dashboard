from __future__ import annotations

from typing import Any, Dict

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jwt import InvalidTokenError

from .config import get_settings
from .models import Principal
from .rbac import highest_role, normalize_role


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


def _role_from_claims(payload: Dict[str, Any], role_claim: str) -> str:
    direct_role = payload.get(role_claim) or payload.get("hoptimize_role")
    if isinstance(direct_role, str):
        return normalize_role(direct_role)

    for list_claim in ("roles", "groups", "scope", "scp"):
        value = payload.get(list_claim)
        if isinstance(value, str):
            candidates = value.replace(",", " ").split()
        elif isinstance(value, list):
            candidates = [str(item) for item in value]
        else:
            continue

        roles = []
        for item in candidates:
            lowered = item.lower()
            if lowered.startswith("hoptimize:"):
                lowered = lowered.split(":", 1)[1]
            if lowered in {"viewer", "operator", "admin", "owner"}:
                roles.append(lowered)
        if roles:
            return highest_role(roles)

    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Missing role claim")


async def get_current_principal(token: str = Depends(oauth2_scheme)) -> Principal:
    settings = get_settings()
    if not settings.jwt_secret:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="JWT authentication is not configured",
        )

    decode_kwargs: Dict[str, Any] = {
        "algorithms": [settings.jwt_algorithm],
        "options": {"require": ["sub"]},
    }
    if settings.jwt_issuer:
        decode_kwargs["issuer"] = settings.jwt_issuer
    if settings.jwt_audience:
        decode_kwargs["audience"] = settings.jwt_audience
    else:
        decode_kwargs["options"]["verify_aud"] = False

    try:
        payload = jwt.decode(token, settings.jwt_secret, **decode_kwargs)
    except InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    subject = payload.get("sub") or payload.get("preferred_username") or payload.get("email")
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token subject is required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    role = _role_from_claims(payload, settings.jwt_role_claim)
    return Principal(subject=str(subject), role=role, claims=payload)
