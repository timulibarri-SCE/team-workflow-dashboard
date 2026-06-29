#!/usr/bin/env bash
set -euo pipefail

CONFIG_FILE="${CONFIG_FILE:-/etc/cloudflared/config.yml}"
HOSTNAME_TARGET="${HOSTNAME_TARGET:-564distech.facilities-engineering.com}"
ORIGIN_URL="${1:-${DISTECH_564_ORIGIN:-}}"

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run as root: sudo $0 http://CONTROLLER_IP:PORT" >&2
  exit 1
fi

if [[ -z "${ORIGIN_URL}" ]]; then
  echo "Usage: sudo $0 http://CONTROLLER_IP:PORT" >&2
  echo "Example: sudo $0 http://192.168.20.50:80" >&2
  exit 1
fi

case "${ORIGIN_URL}" in
  http://*|https://*) ;;
  *)
    echo "Origin must start with http:// or https://: ${ORIGIN_URL}" >&2
    exit 1
    ;;
esac

if [[ "${ORIGIN_URL}" =~ [[:space:]] ]]; then
  echo "Origin URL cannot contain whitespace." >&2
  exit 1
fi

if [[ ! -f "${CONFIG_FILE}" ]]; then
  echo "Cloudflare config not found: ${CONFIG_FILE}" >&2
  exit 1
fi

backup="${CONFIG_FILE}.$(date -u +%Y%m%dT%H%M%SZ).bak"
tmp="$(mktemp)"

cp -a "${CONFIG_FILE}" "${backup}"

awk -v host="${HOSTNAME_TARGET}" -v origin="${ORIGIN_URL}" '
  $0 ~ "hostname:[[:space:]]*" host "[[:space:]]*$" {
    in_host = 1
    print
    next
  }
  in_host && $0 ~ /^[[:space:]]*service:[[:space:]]*/ {
    sub(/service:[[:space:]].*$/, "service: " origin)
    changed = 1
    in_host = 0
    print
    next
  }
  { print }
  END {
    if (!changed) {
      exit 42
    }
  }
' "${CONFIG_FILE}" > "${tmp}" || {
  rc=$?
  rm -f "${tmp}"
  if [[ "${rc}" -eq 42 ]]; then
    echo "Did not find service line for ${HOSTNAME_TARGET} in ${CONFIG_FILE}." >&2
  fi
  exit "${rc}"
}

install -m 0644 "${tmp}" "${CONFIG_FILE}"
rm -f "${tmp}"

systemctl restart cloudflared.service

echo "Updated ${HOSTNAME_TARGET} origin to ${ORIGIN_URL}"
echo "Backup saved at ${backup}"
systemctl --no-pager --full status cloudflared.service | sed -n '1,12p'
