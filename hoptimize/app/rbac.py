from __future__ import annotations

from typing import Dict

from fastapi import HTTPException, status

from .models import Principal


ROLE_ORDER = {
    "viewer": 10,
    "operator": 20,
    "admin": 30,
    "owner": 40,
}


ACTION_MINIMUM_ROLES: Dict[str, str] = {
    "health_check": "viewer",
    "get_system_info": "viewer",
    "get_network_status": "viewer",
    "get_service_status": "viewer",
    "get_service_logs": "viewer",
    "get_docker_status": "viewer",
    "check_frp_status": "viewer",
    "list_services": "viewer",
    "list_actions": "viewer",
    "restart_service": "operator",
    "restart_container": "operator",
    "restart_frpc": "operator",
    "deploy_compose_stack": "admin",
    "rotate_frp_token": "admin",
    "reload_nginx_or_traefik": "admin",
    "read_audit": "admin",
    "manage_allowed_actions": "owner",
}


def normalize_role(role: str) -> str:
    value = (role or "").strip().lower()
    if value not in ROLE_ORDER:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unknown role")
    return value


def highest_role(roles: list[str]) -> str:
    known = [normalize_role(role) for role in roles if role]
    if not known:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Missing role")
    return max(known, key=lambda role: ROLE_ORDER[role])


def require_role(principal: Principal, action: str) -> None:
    if action not in ACTION_MINIMUM_ROLES:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Unknown action")

    principal_role = normalize_role(principal.role)
    required_role = ACTION_MINIMUM_ROLES[action]
    if ROLE_ORDER[principal_role] < ROLE_ORDER[required_role]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient role")
