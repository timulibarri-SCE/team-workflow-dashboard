from __future__ import annotations

import os
from dataclasses import dataclass
from functools import lru_cache
from typing import List, Optional


def _csv(name: str, default: str) -> List[str]:
    raw = os.getenv(name, default)
    return [item.strip() for item in raw.split(",") if item.strip()]


def _int(name: str, default: int) -> int:
    raw = os.getenv(name)
    if raw is None:
        return default
    try:
        return int(raw)
    except ValueError:
        return default


@dataclass(frozen=True)
class Settings:
    app_name: str
    db_path: str
    jwt_secret: str
    jwt_algorithm: str
    jwt_issuer: Optional[str]
    jwt_audience: Optional[str]
    jwt_role_claim: str
    allowed_services: List[str]
    allowed_containers: List[str]
    allowed_compose_stacks: List[str]
    log_line_values: List[int]
    log_summary_chars: int
    command_timeout_seconds: int
    systemctl_path: str
    journalctl_path: str
    sudo_path: str
    use_sudo: bool


@lru_cache
def get_settings() -> Settings:
    log_values = []
    for value in _csv("HOPTIMIZE_LOG_LINE_VALUES", "50,100,200,500"):
        try:
            log_values.append(int(value))
        except ValueError:
            continue
    if not log_values:
        log_values = [200]

    return Settings(
        app_name=os.getenv("HOPTIMIZE_APP_NAME", "Hoptimize"),
        db_path=os.getenv("HOPTIMIZE_DB_PATH", "/var/lib/hoptimize/audit.sqlite3"),
        jwt_secret=os.getenv("HOPTIMIZE_JWT_SECRET", ""),
        jwt_algorithm=os.getenv("HOPTIMIZE_JWT_ALGORITHM", "HS256"),
        jwt_issuer=os.getenv("HOPTIMIZE_JWT_ISSUER") or None,
        jwt_audience=os.getenv("HOPTIMIZE_JWT_AUDIENCE") or None,
        jwt_role_claim=os.getenv("HOPTIMIZE_JWT_ROLE_CLAIM", "role"),
        allowed_services=_csv(
            "HOPTIMIZE_ALLOWED_SERVICES",
            "frpc,bms-api,fuxa,nginx,traefik,docker,hoptimize",
        ),
        allowed_containers=_csv(
            "HOPTIMIZE_ALLOWED_CONTAINERS",
            "frpc,bms-api,fuxa,nginx,traefik,hoptimize",
        ),
        allowed_compose_stacks=_csv("HOPTIMIZE_ALLOWED_COMPOSE_STACKS", ""),
        log_line_values=sorted(set(log_values)),
        log_summary_chars=_int("HOPTIMIZE_LOG_SUMMARY_CHARS", 2000),
        command_timeout_seconds=_int("HOPTIMIZE_COMMAND_TIMEOUT_SECONDS", 30),
        systemctl_path=os.getenv("HOPTIMIZE_SYSTEMCTL_PATH", "/usr/bin/systemctl"),
        journalctl_path=os.getenv("HOPTIMIZE_JOURNALCTL_PATH", "/usr/bin/journalctl"),
        sudo_path=os.getenv("HOPTIMIZE_SUDO_PATH", "/usr/bin/sudo"),
        use_sudo=os.getenv("HOPTIMIZE_USE_SUDO", "true").lower() in {"1", "true", "yes"},
    )
