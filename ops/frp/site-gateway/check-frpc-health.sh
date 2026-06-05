#!/usr/bin/env bash
set -euo pipefail

site_id="${1:-site1}"
service_name="${2:-gateway-dashboard}"
local_host="${3:-127.0.0.1}"
local_port="${4:-8080}"

systemctl is-active --quiet frpc.service

if command -v curl >/dev/null 2>&1; then
  curl -fsS -I --max-time 5 "http://${local_host}:${local_port}/" >/dev/null
elif command -v nc >/dev/null 2>&1; then
  nc -z -w 3 "$local_host" "$local_port"
fi

logger -t frpc-health "ok site=${site_id} service=${service_name} local=${local_host}:${local_port}"
printf 'frpc healthy: site=%s service=%s local=%s:%s\n' "$site_id" "$service_name" "$local_host" "$local_port"
