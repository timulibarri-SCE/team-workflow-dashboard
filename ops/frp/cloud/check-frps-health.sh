#!/usr/bin/env bash
set -euo pipefail

site_id="${1:-site1}"
public_route="${2:-site1.example.com}"
bind_port="${3:-7000}"
vhost_port="${4:-8088}"

systemctl is-active --quiet frps.service

if command -v ss >/dev/null 2>&1; then
  ss -ltn | grep -Eq "(:|\\.)${bind_port}\\b"
  ss -ltn | grep -Eq "127\\.0\\.0\\.1:${vhost_port}\\b|\\[::1\\]:${vhost_port}\\b"
fi

if command -v curl >/dev/null 2>&1; then
  curl -fsS -I -H "Host: ${public_route}" "http://127.0.0.1:${vhost_port}/" >/dev/null
fi

logger -t frps-health "ok site=${site_id} public_route=${public_route} bind_port=${bind_port} vhost_port=${vhost_port}"
printf 'frps healthy: site=%s route=%s bind=%s vhost=%s\n' "$site_id" "$public_route" "$bind_port" "$vhost_port"
