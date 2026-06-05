from __future__ import annotations

from typing import Any

from fastapi import HTTPException, status

from ..config import get_settings


def _container_or_404(container_name: str) -> str:
    settings = get_settings()
    if container_name not in settings.allowed_containers:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Unknown container")
    return container_name


def _client():
    try:
        import docker
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Docker SDK is unavailable: {exc.__class__.__name__}",
        )

    try:
        return docker.from_env()
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Docker is unavailable: {exc.__class__.__name__}",
        )


def status() -> list[dict[str, Any]]:
    client = _client()
    allowed = set(get_settings().allowed_containers)
    containers = []
    for container in client.containers.list(all=True):
        names = {container.name}
        names.update(container.attrs.get("Names", []) if isinstance(container.attrs, dict) else [])
        if container.name not in allowed:
            continue
        containers.append(
            {
                "name": container.name,
                "id": container.short_id,
                "status": container.status,
                "image": ", ".join(container.image.tags) if container.image.tags else container.image.short_id,
            }
        )
    return containers


def restart_container(container_name: str, dry_run: bool = False) -> dict[str, Any]:
    name = _container_or_404(container_name)
    if dry_run:
        return {"name": name, "status": "dry-run", "detail": "container restart not executed"}

    client = _client()
    try:
        container = client.containers.get(name)
        container.restart()
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Container restart failed: {exc.__class__.__name__}",
        )
    return {"name": name, "status": "ok", "detail": "restart requested"}
