#!/usr/bin/env bash
set -euo pipefail

section() {
  printf '\n## %s\n' "$*"
}

run_if_available() {
  local command_name="$1"
  shift

  if command -v "${command_name}" >/dev/null 2>&1; then
    "$@" || true
  else
    echo "${command_name} is not installed"
  fi
}

section "Host"
hostnamectl 2>/dev/null || hostname || true
uptime || true

section "Required Tunnel Services"
for service in tailscaled docker 564distech-cloudflared ssh sshd; do
  if command -v systemctl >/dev/null 2>&1 && systemctl list-unit-files "${service}.service" --no-legend 2>/dev/null | grep -q "^${service}\.service"; then
    systemctl --no-pager --full status "${service}.service" | sed -n '1,12p' || true
  fi
done

section "Versions"
run_if_available tailscale tailscale version
run_if_available cloudflared cloudflared --version
run_if_available docker docker --version
if command -v docker >/dev/null 2>&1; then
  docker compose version || true
fi
run_if_available git git --version

section "Package Updates"
if command -v apt-get >/dev/null 2>&1; then
  if [[ "${REFRESH_PACKAGE_INDEX:-false}" == "true" ]]; then
    apt-get update
  else
    echo "Set REFRESH_PACKAGE_INDEX=true to refresh apt metadata before this check."
  fi
  apt list --upgradable 2>/dev/null || true
elif command -v dnf >/dev/null 2>&1; then
  dnf check-update || true
elif command -v yum >/dev/null 2>&1; then
  yum check-update || true
else
  echo "No supported package manager found."
fi

section "Cloudflared Container"
if command -v docker >/dev/null 2>&1; then
  docker ps --filter name=564distech-cloudflared --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}' || true
  if [[ -f docker-compose.cloudflared.yml ]]; then
    docker compose -f docker-compose.cloudflared.yml ps || true
  fi
fi

section "Running Services"
if command -v systemctl >/dev/null 2>&1; then
  systemctl --type=service --state=running --no-pager --plain \
    | sed -n '1,120p'
fi

section "High CPU Processes"
ps -eo pid,ppid,comm,%cpu,%mem,args --sort=-%cpu | sed -n '1,25p' || true

section "High Memory Processes"
ps -eo pid,ppid,comm,%mem,%cpu,args --sort=-%mem | sed -n '1,25p' || true

section "Energy-Relevant Optional Services"
for service in avahi-daemon bluetooth cups ModemManager packagekit snapd thermald upower; do
  if command -v systemctl >/dev/null 2>&1 && systemctl list-unit-files "${service}.service" --no-legend 2>/dev/null | grep -q "^${service}\.service"; then
    systemctl is-active "${service}.service" >/dev/null 2>&1 && state="active" || state="inactive"
    systemctl is-enabled "${service}.service" >/dev/null 2>&1 && enabled="enabled" || enabled="disabled"
    printf '%-20s %-10s %-10s\n' "${service}.service" "${state}" "${enabled}"
  fi
done

section "Power Profile"
if command -v powerprofilesctl >/dev/null 2>&1; then
  powerprofilesctl get || true
elif [[ -r /sys/devices/system/cpu/cpu0/cpufreq/scaling_governor ]]; then
  cat /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor 2>/dev/null | sort -u
else
  echo "No power profile tool or CPU governor data found."
fi
