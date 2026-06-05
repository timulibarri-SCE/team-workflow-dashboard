from __future__ import annotations

from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class Principal(BaseModel):
    subject: str
    role: str
    claims: Dict[str, Any] = Field(default_factory=dict)


class HealthResponse(BaseModel):
    status: str
    service: str


class ActionDefinition(BaseModel):
    name: str
    minimum_role: str
    description: str
    dangerous: bool = False
    implemented: bool = True


class ActionResult(BaseModel):
    request_id: str
    action: str
    target: str
    status: str
    command_executed: str = ""
    stdout_summary: str = ""
    stderr_summary: str = ""
    data: Dict[str, Any] = Field(default_factory=dict)
    dry_run: bool = False


class RestartRequest(BaseModel):
    dry_run: bool = False


class ComposeDeployRequest(BaseModel):
    stack_name: str
    dry_run: bool = True
    approved: bool = False


class RotateTokenRequest(BaseModel):
    site_id: str
    dry_run: bool = True
    approved: bool = False


class AuditRecord(BaseModel):
    id: int
    timestamp: str
    requester: str
    requester_role: str
    source_ip: str
    action: str
    target: str
    command_executed: str
    status: str
    stdout_summary: str
    stderr_summary: str
    request_id: str


class AuditListResponse(BaseModel):
    records: List[AuditRecord]


class ServiceSummary(BaseModel):
    name: str
    approved: bool


class ServiceListResponse(BaseModel):
    services: List[ServiceSummary]


class DockerStatusResponse(BaseModel):
    request_id: str
    status: str
    containers: List[Dict[str, Any]] = Field(default_factory=list)
    detail: Optional[str] = None
