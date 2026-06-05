from __future__ import annotations

import datetime
import os
import sys
from pathlib import Path

import jwt
import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))


def make_token(role: str, subject: str = "test-user") -> str:
    payload = {
        "sub": subject,
        "role": role,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(minutes=5),
    }
    return jwt.encode(payload, os.environ["HOPTIMIZE_JWT_SECRET"], algorithm="HS256")


@pytest.fixture()
def client(tmp_path, monkeypatch):
    monkeypatch.setenv("HOPTIMIZE_DB_PATH", str(tmp_path / "audit.sqlite3"))
    monkeypatch.setenv("HOPTIMIZE_JWT_SECRET", "test-secret")
    monkeypatch.setenv("HOPTIMIZE_ALLOWED_SERVICES", "frpc,bms-api,fuxa,nginx,traefik,docker,hoptimize")
    monkeypatch.setenv("HOPTIMIZE_ALLOWED_CONTAINERS", "frpc,bms-api,fuxa,nginx,traefik,hoptimize")
    monkeypatch.setenv("HOPTIMIZE_LOG_SUMMARY_CHARS", "80")
    monkeypatch.setenv("HOPTIMIZE_USE_SUDO", "false")

    from app.config import get_settings

    get_settings.cache_clear()

    from app.main import app

    with TestClient(app) as test_client:
        yield test_client


def auth_header(role: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {make_token(role)}"}


def test_health_is_open(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_protected_endpoint_rejects_missing_token(client):
    response = client.get("/v1/services")
    assert response.status_code == 401


def test_viewer_can_read_status_but_cannot_restart(client, monkeypatch):
    from app.actions import CommandResult
    from app import main

    monkeypatch.setattr(
        main.systemd,
        "get_status",
        lambda service: CommandResult(["systemctl", "status", service], 0, "active", ""),
    )

    response = client.get("/v1/services/frpc/status", headers=auth_header("viewer"))
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

    restart = client.post(
        "/v1/services/frpc/restart",
        headers=auth_header("viewer"),
        json={"dry_run": True},
    )
    assert restart.status_code == 403


def test_operator_can_restart_frpc_dry_run(client, monkeypatch):
    from app.actions import CommandResult
    from app import main

    monkeypatch.setattr(
        main.systemd,
        "restart",
        lambda service, dry_run=False: CommandResult(
            ["systemctl", "restart", service],
            0,
            "dry-run: service restart not executed" if dry_run else "restarted",
            "",
        ),
    )

    response = client.post(
        "/v1/services/frpc/restart",
        headers=auth_header("operator"),
        json={"dry_run": True},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["dry_run"] is True
    assert body["command_executed"] == "systemctl restart frpc"


def test_unknown_service_restart_is_rejected(client):
    response = client.post(
        "/v1/services/not-approved/restart",
        headers=auth_header("operator"),
        json={"dry_run": True},
    )
    assert response.status_code == 404


def test_arbitrary_command_request_is_impossible(client, monkeypatch):
    from app.actions import CommandResult
    from app import main

    monkeypatch.setattr(
        main.systemd,
        "get_status",
        lambda service: CommandResult(["systemctl", "status", service], 0, "active", ""),
    )

    response = client.get(
        "/v1/services/frpc/status?cmd=id",
        headers=auth_header("viewer"),
    )
    assert response.status_code == 200
    assert "id" not in response.json()["command_executed"]


def test_audit_records_successful_action(client, monkeypatch):
    from app.actions import CommandResult
    from app import main

    monkeypatch.setattr(
        main.systemd,
        "get_status",
        lambda service: CommandResult(["systemctl", "status", service], 0, "active", ""),
    )

    client.get("/v1/services/frpc/status", headers=auth_header("viewer"))

    response = client.get("/v1/audit", headers=auth_header("admin"))
    assert response.status_code == 200
    actions = [record["action"] for record in response.json()["records"]]
    assert "get_service_status" in actions


def test_logs_are_capped_and_secrets_redacted(client, monkeypatch):
    from app.actions import CommandResult
    from app import main

    secret_text = "password=supersecret " + ("x" * 300)
    monkeypatch.setattr(
        main.systemd,
        "logs",
        lambda service, lines: CommandResult(["journalctl", "-u", service, "-n", str(lines)], 0, secret_text, ""),
    )

    response = client.get("/v1/services/frpc/logs?lines=200", headers=auth_header("viewer"))
    assert response.status_code == 200
    stdout = response.json()["stdout_summary"]
    assert "supersecret" not in stdout
    assert "password=[REDACTED]" in stdout
    assert "[truncated]" in stdout
