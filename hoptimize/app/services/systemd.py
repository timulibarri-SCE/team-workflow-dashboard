from __future__ import annotations

from fastapi import HTTPException, status

from ..actions import CommandResult, command_to_string, run_fixed_command, summarize
from ..config import get_settings


def _service_or_404(service_name: str) -> str:
    settings = get_settings()
    if service_name not in settings.allowed_services:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Unknown service")
    return service_name


def _sudo_prefix() -> list[str]:
    settings = get_settings()
    if not settings.use_sudo:
        return []
    return [settings.sudo_path, "-n"]


def _systemctl_command(*args: str) -> list[str]:
    settings = get_settings()
    return _sudo_prefix() + [settings.systemctl_path] + list(args)


def _journalctl_command(*args: str) -> list[str]:
    settings = get_settings()
    return _sudo_prefix() + [settings.journalctl_path] + list(args)


def allowed_services() -> list[str]:
    return list(get_settings().allowed_services)


def get_status(service_name: str) -> CommandResult:
    service = _service_or_404(service_name)
    return run_fixed_command(_systemctl_command("status", service, "--no-pager"))


def restart(service_name: str, dry_run: bool = False) -> CommandResult:
    service = _service_or_404(service_name)
    command = _systemctl_command("restart", service)
    if dry_run:
        return CommandResult(command=command, returncode=0, stdout="dry-run: service restart not executed", stderr="")
    return run_fixed_command(command)


def logs(service_name: str, lines: int) -> CommandResult:
    service = _service_or_404(service_name)
    allowed_lines = get_settings().log_line_values
    if lines not in allowed_lines:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"lines must be one of {allowed_lines}",
        )
    return run_fixed_command(_journalctl_command("-u", service, "-n", str(lines), "--no-pager"))


def result_payload(result: CommandResult) -> dict[str, str | int]:
    return {
        "returncode": result.returncode,
        "command": command_to_string(result.command),
        "stdout": summarize(result.stdout),
        "stderr": summarize(result.stderr),
    }
