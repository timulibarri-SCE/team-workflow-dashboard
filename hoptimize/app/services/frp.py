from __future__ import annotations

from fastapi import HTTPException, status

from ..actions import CommandResult
from . import systemd


FRPC_SERVICE = "frpc"


def status() -> CommandResult:
    return systemd.get_status(FRPC_SERVICE)


def restart(dry_run: bool = False) -> CommandResult:
    return systemd.restart(FRPC_SERVICE, dry_run=dry_run)


def rotate_token(site_id: str, dry_run: bool, approved: bool) -> dict[str, str]:
    if not approved:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token rotation requires approved=true",
        )
    if dry_run:
        return {"site_id": site_id, "status": "dry-run", "detail": "token rotation not executed"}
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Token rotation is intentionally not implemented in the first safe release",
    )
