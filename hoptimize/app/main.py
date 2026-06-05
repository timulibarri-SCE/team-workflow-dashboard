from __future__ import annotations

import uuid

from fastapi import Depends, FastAPI, HTTPException, Request, Response, status

from . import audit
from .actions import action_definitions, command_to_string, summarize
from .auth import get_current_principal
from .config import get_settings
from .models import (
    ActionDefinition,
    ActionResult,
    AuditListResponse,
    ComposeDeployRequest,
    DockerStatusResponse,
    HealthResponse,
    Principal,
    RestartRequest,
    RotateTokenRequest,
    ServiceListResponse,
    ServiceSummary,
)
from .rbac import require_role
from .services import docker_ops, frp, network, systemd


app = FastAPI(title="Hoptimize", version="0.1.0")


@app.on_event("startup")
def startup() -> None:
    audit.init_db()


@app.middleware("http")
async def request_id_middleware(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
    request.state.request_id = request_id
    response: Response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    return response


def _source_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",", 1)[0].strip()
    if request.client:
        return request.client.host
    return "unknown"


def _record(request: Request, principal: Principal, result: ActionResult) -> ActionResult:
    audit.record(principal, _source_ip(request), result)
    return result


def _reject_unknown_target(request: Request, principal: Principal, action: str, target: str, kind: str) -> None:
    result = ActionResult(
        request_id=request.state.request_id,
        action=action,
        target=target,
        status="rejected",
        stderr_summary=f"Unknown {kind}: {target}",
    )
    _record(request, principal, result)
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Unknown {kind}")


def _ensure_allowed_service(request: Request, principal: Principal, action: str, service_name: str) -> None:
    if service_name not in get_settings().allowed_services:
        _reject_unknown_target(request, principal, action, service_name, "service")


def _ensure_allowed_container(request: Request, principal: Principal, action: str, container_name: str) -> None:
    if container_name not in get_settings().allowed_containers:
        _reject_unknown_target(request, principal, action, container_name, "container")


def _result_from_command(request: Request, action: str, target: str, command_result, dry_run: bool = False) -> ActionResult:
    return ActionResult(
        request_id=request.state.request_id,
        action=action,
        target=target,
        status=command_result.status,
        command_executed=command_to_string(command_result.command),
        stdout_summary=summarize(command_result.stdout),
        stderr_summary=summarize(command_result.stderr),
        data={"returncode": command_result.returncode},
        dry_run=dry_run,
    )


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(status="ok", service=get_settings().app_name)


@app.get("/v1/actions", response_model=list[ActionDefinition])
def list_actions(
    request: Request,
    principal: Principal = Depends(get_current_principal),
) -> list[ActionDefinition]:
    require_role(principal, "list_actions")
    result = ActionResult(
        request_id=request.state.request_id,
        action="list_actions",
        target="actions",
        status="ok",
        data={"count": len(action_definitions())},
    )
    _record(request, principal, result)
    return action_definitions()


@app.get("/v1/system/info")
def get_system_info(
    request: Request,
    principal: Principal = Depends(get_current_principal),
):
    require_role(principal, "get_system_info")
    data = network.system_info()
    result = ActionResult(
        request_id=request.state.request_id,
        action="get_system_info",
        target="system",
        status="ok",
        stdout_summary=str(data),
        data=data,
    )
    return _record(request, principal, result)


@app.get("/v1/network/status")
def get_network_status(
    request: Request,
    principal: Principal = Depends(get_current_principal),
):
    require_role(principal, "get_network_status")
    result = _result_from_command(request, "get_network_status", "network", network.network_status())
    return _record(request, principal, result)


@app.get("/v1/services", response_model=ServiceListResponse)
def list_services(
    request: Request,
    principal: Principal = Depends(get_current_principal),
) -> ServiceListResponse:
    require_role(principal, "list_services")
    services = [ServiceSummary(name=name, approved=True) for name in systemd.allowed_services()]
    result = ActionResult(
        request_id=request.state.request_id,
        action="list_services",
        target="services",
        status="ok",
        data={"count": len(services)},
    )
    _record(request, principal, result)
    return ServiceListResponse(services=services)


@app.get("/v1/services/{service_name}/status")
def get_service_status(
    service_name: str,
    request: Request,
    principal: Principal = Depends(get_current_principal),
):
    require_role(principal, "get_service_status")
    _ensure_allowed_service(request, principal, "get_service_status", service_name)
    result = _result_from_command(
        request,
        "get_service_status",
        service_name,
        systemd.get_status(service_name),
    )
    return _record(request, principal, result)


@app.post("/v1/services/{service_name}/restart")
def restart_service(
    service_name: str,
    body: RestartRequest,
    request: Request,
    principal: Principal = Depends(get_current_principal),
):
    require_role(principal, "restart_service")
    _ensure_allowed_service(request, principal, "restart_service", service_name)
    result = _result_from_command(
        request,
        "restart_service",
        service_name,
        systemd.restart(service_name, dry_run=body.dry_run),
        dry_run=body.dry_run,
    )
    return _record(request, principal, result)


@app.get("/v1/services/{service_name}/logs")
def get_service_logs(
    service_name: str,
    request: Request,
    lines: int = 200,
    principal: Principal = Depends(get_current_principal),
):
    require_role(principal, "get_service_logs")
    _ensure_allowed_service(request, principal, "get_service_logs", service_name)
    result = _result_from_command(
        request,
        "get_service_logs",
        service_name,
        systemd.logs(service_name, lines),
    )
    return _record(request, principal, result)


@app.get("/v1/docker/status", response_model=DockerStatusResponse)
def get_docker_status(
    request: Request,
    principal: Principal = Depends(get_current_principal),
) -> DockerStatusResponse:
    require_role(principal, "get_docker_status")
    containers = docker_ops.status()
    result = ActionResult(
        request_id=request.state.request_id,
        action="get_docker_status",
        target="docker",
        status="ok",
        data={"container_count": len(containers)},
    )
    _record(request, principal, result)
    return DockerStatusResponse(request_id=request.state.request_id, status="ok", containers=containers)


@app.post("/v1/docker/containers/{container_name}/restart")
def restart_container(
    container_name: str,
    body: RestartRequest,
    request: Request,
    principal: Principal = Depends(get_current_principal),
):
    require_role(principal, "restart_container")
    _ensure_allowed_container(request, principal, "restart_container", container_name)
    data = docker_ops.restart_container(container_name, dry_run=body.dry_run)
    result = ActionResult(
        request_id=request.state.request_id,
        action="restart_container",
        target=container_name,
        status=data.get("status", "ok"),
        command_executed="Docker SDK: container.restart()",
        stdout_summary=str(data),
        data=data,
        dry_run=body.dry_run,
    )
    return _record(request, principal, result)


@app.post("/v1/deploy/compose")
def deploy_compose_stack(
    body: ComposeDeployRequest,
    request: Request,
    principal: Principal = Depends(get_current_principal),
):
    require_role(principal, "deploy_compose_stack")
    settings = get_settings()
    if body.stack_name not in settings.allowed_compose_stacks:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Unknown compose stack")
    if not body.approved:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Deploy requires approved=true")
    result = ActionResult(
        request_id=request.state.request_id,
        action="deploy_compose_stack",
        target=body.stack_name,
        status="dry-run" if body.dry_run else "not_implemented",
        command_executed="docker compose deployment intentionally disabled in first release",
        stdout_summary="dry-run: compose deployment not executed"
        if body.dry_run
        else "not implemented in first safe release",
        dry_run=body.dry_run,
    )
    _record(request, principal, result)
    if not body.dry_run:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Compose deployment is intentionally not implemented in the first safe release",
        )
    return result


@app.get("/v1/frp/status")
def check_frp_status(
    request: Request,
    principal: Principal = Depends(get_current_principal),
):
    require_role(principal, "check_frp_status")
    result = _result_from_command(request, "check_frp_status", "frpc", frp.status())
    return _record(request, principal, result)


@app.post("/v1/frp/restart")
def restart_frpc(
    body: RestartRequest,
    request: Request,
    principal: Principal = Depends(get_current_principal),
):
    require_role(principal, "restart_frpc")
    result = _result_from_command(
        request,
        "restart_frpc",
        "frpc",
        frp.restart(dry_run=body.dry_run),
        dry_run=body.dry_run,
    )
    return _record(request, principal, result)


@app.post("/v1/frp/rotate-token")
def rotate_frp_token(
    body: RotateTokenRequest,
    request: Request,
    principal: Principal = Depends(get_current_principal),
):
    require_role(principal, "rotate_frp_token")
    data = frp.rotate_token(body.site_id, dry_run=body.dry_run, approved=body.approved)
    result = ActionResult(
        request_id=request.state.request_id,
        action="rotate_frp_token",
        target=body.site_id,
        status=data.get("status", "ok"),
        command_executed="FRP token rotation intentionally disabled in first release",
        stdout_summary=str(data),
        data=data,
        dry_run=body.dry_run,
    )
    return _record(request, principal, result)


@app.get("/v1/audit", response_model=AuditListResponse)
def get_audit(
    request: Request,
    limit: int = 100,
    principal: Principal = Depends(get_current_principal),
) -> AuditListResponse:
    require_role(principal, "read_audit")
    records = list(audit.list_records(limit=limit))
    result = ActionResult(
        request_id=request.state.request_id,
        action="read_audit",
        target="audit",
        status="ok",
        data={"count": len(records)},
    )
    _record(request, principal, result)
    return AuditListResponse(records=records)
