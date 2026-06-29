#!/usr/bin/env bash
set -euo pipefail

origin="${DISTECH_564_ORIGIN:-http://127.0.0.1/}"
enable_funnel="${ENABLE_FUNNEL:-false}"

run_tailscale() {
  if [[ ${EUID} -ne 0 ]] && command -v sudo >/dev/null 2>&1; then
    sudo tailscale "$@"
  else
    tailscale "$@"
  fi
}

if ! command -v tailscale >/dev/null 2>&1; then
  echo "tailscale is required on 564Distech before configuring Serve." >&2
  exit 1
fi

if command -v curl >/dev/null 2>&1; then
  if ! curl -fsS --max-time 5 "${origin}" >/dev/null; then
    echo "Warning: the 564Distech controller origin did not respond at ${origin} from this host." >&2
    echo "Confirm the controller UI is running before relying on remote access." >&2
  fi
fi

run_tailscale serve --yes --bg "${origin}"
run_tailscale serve status

if [[ "${enable_funnel}" == "true" ]]; then
  run_tailscale funnel --yes --bg "${origin}"
  run_tailscale funnel status
else
  cat <<'MSG'
Tailscale Serve is configured for tailnet access.

Cloudflare Tunnel is the preferred public route for 564distech.facilities-engineering.com.
For a temporary public Tailscale Funnel URL, rerun with:
  ENABLE_FUNNEL=true sudo ./configure-564distech-tailscale.sh
MSG
fi
