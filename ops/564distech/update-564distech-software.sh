#!/usr/bin/env bash
set -euo pipefail

apply_updates="${APPLY_UPDATES:-false}"

if [[ ${EUID} -ne 0 ]]; then
  echo "Run this update check with sudo on 564Distech." >&2
  exit 1
fi

log() {
  printf '\n==> %s\n' "$*"
}

if [[ "${apply_updates}" != "true" ]]; then
  cat <<'MSG'
Dry run only. This will refresh package metadata and show pending updates.
To install updates, rerun with:
  APPLY_UPDATES=true sudo ./update-564distech-software.sh
MSG
fi

if command -v apt-get >/dev/null 2>&1; then
  log "Refreshing apt metadata"
  apt-get update

  log "Pending apt updates"
  apt list --upgradable 2>/dev/null || true

  if [[ "${apply_updates}" == "true" ]]; then
    log "Installing apt updates"
    DEBIAN_FRONTEND=noninteractive apt-get upgrade -y
    DEBIAN_FRONTEND=noninteractive apt-get autoremove -y
  fi
elif command -v dnf >/dev/null 2>&1; then
  log "Checking dnf updates"
  dnf check-update || true

  if [[ "${apply_updates}" == "true" ]]; then
    log "Installing dnf updates"
    dnf upgrade -y
    dnf autoremove -y || true
  fi
elif command -v yum >/dev/null 2>&1; then
  log "Checking yum updates"
  yum check-update || true

  if [[ "${apply_updates}" == "true" ]]; then
    log "Installing yum updates"
    yum update -y
  fi
else
  echo "No supported package manager found." >&2
  exit 1
fi

if command -v tailscale >/dev/null 2>&1; then
  log "Tailscale version"
  tailscale version || true
fi

if command -v cloudflared >/dev/null 2>&1; then
  log "cloudflared version"
  cloudflared --version || true
fi

if command -v docker >/dev/null 2>&1 && [[ -f docker-compose.cloudflared.yml ]]; then
  if [[ "${apply_updates}" == "true" ]]; then
    log "Pulling current 564Distech Cloudflare tunnel image"
    docker compose -f docker-compose.cloudflared.yml pull

    log "Restarting 564Distech tunnel container with the current image"
    docker compose -f docker-compose.cloudflared.yml up -d --remove-orphans
  else
    log "Current 564Distech Cloudflare tunnel image"
    docker compose -f docker-compose.cloudflared.yml images || true
    echo "Set APPLY_UPDATES=true to pull the current image and restart the tunnel container."
  fi
fi

if command -v systemctl >/dev/null 2>&1; then
  log "Service state"
  for service in tailscaled docker 564distech-cloudflared; do
    if systemctl list-unit-files "${service}.service" --no-legend 2>/dev/null | grep -q "^${service}\.service"; then
      systemctl --no-pager --full status "${service}.service" | sed -n '1,8p' || true
    fi
  done
fi
