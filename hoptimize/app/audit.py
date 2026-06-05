from __future__ import annotations

import os
import sqlite3
from datetime import datetime, timezone
from typing import Iterable

from .actions import summarize
from .config import get_settings
from .models import ActionResult, AuditRecord, Principal


SCHEMA = """
CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT NOT NULL,
    requester TEXT NOT NULL,
    requester_role TEXT NOT NULL,
    source_ip TEXT NOT NULL,
    action TEXT NOT NULL,
    target TEXT NOT NULL,
    command_executed TEXT NOT NULL,
    status TEXT NOT NULL,
    stdout_summary TEXT NOT NULL,
    stderr_summary TEXT NOT NULL,
    request_id TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_request_id ON audit_log(request_id);
"""


def _connect() -> sqlite3.Connection:
    settings = get_settings()
    parent = os.path.dirname(settings.db_path)
    if parent:
        os.makedirs(parent, exist_ok=True)
    conn = sqlite3.connect(settings.db_path)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    with _connect() as conn:
        conn.executescript(SCHEMA)


def record(
    principal: Principal,
    source_ip: str,
    action_result: ActionResult,
) -> int:
    init_db()
    now = datetime.now(timezone.utc).isoformat()
    with _connect() as conn:
        cursor = conn.execute(
            """
            INSERT INTO audit_log (
                timestamp, requester, requester_role, source_ip, action, target,
                command_executed, status, stdout_summary, stderr_summary, request_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                now,
                principal.subject,
                principal.role,
                source_ip,
                action_result.action,
                action_result.target,
                action_result.command_executed,
                action_result.status,
                summarize(action_result.stdout_summary),
                summarize(action_result.stderr_summary),
                action_result.request_id,
            ),
        )
        return int(cursor.lastrowid)


def list_records(limit: int = 100) -> Iterable[AuditRecord]:
    init_db()
    safe_limit = max(1, min(limit, 500))
    with _connect() as conn:
        rows = conn.execute(
            """
            SELECT id, timestamp, requester, requester_role, source_ip, action,
                   target, command_executed, status, stdout_summary,
                   stderr_summary, request_id
            FROM audit_log
            ORDER BY id DESC
            LIMIT ?
            """,
            (safe_limit,),
        ).fetchall()
    return [AuditRecord(**dict(row)) for row in rows]
