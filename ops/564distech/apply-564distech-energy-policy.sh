#!/usr/bin/env bash
set -euo pipefail

apply="${APPLY_ENERGY_POLICY:-false}"

required_services=(
  docker.service
  ssh.service
  sshd.service
  tailscaled.service
  564distech-cloudflared.service
)

optional_services=(
  avahi-daemon.service
  avahi-daemon.socket
  bluetooth.service
  cups.service
  cups.path
  cups.socket
  ModemManager.service
  packagekit.service
  snapd.service
  snapd.socket
)

run_or_show() {
  if [[ "${apply}" == "true" ]]; then
    "$@" || {
      status=$?
      echo "Warning: command failed with status ${status}: $*" >&2
      return 0
    }
  else
    printf 'DRY RUN:'
    printf ' %q' "$@"
    printf '\n'
  fi
}

unit_exists() {
  local unit="$1"
  command -v systemctl >/dev/null 2>&1 \
    && systemctl list-unit-files "${unit}" --no-legend 2>/dev/null | grep -q "^${unit}"
}

is_required() {
  local unit="$1"
  local required
  for required in "${required_services[@]}"; do
    [[ "${unit}" == "${required}" ]] && return 0
  done
  return 1
}

if [[ ${EUID} -ne 0 ]]; then
  echo "Run this energy policy script with sudo on 564Distech." >&2
  exit 1
fi

if [[ "${apply}" != "true" ]]; then
  cat <<'MSG'
Dry run only. This will show what would be powered down or tuned.
To apply it, rerun with:
  APPLY_ENERGY_POLICY=true sudo ./apply-564distech-energy-policy.sh
MSG
fi

echo
echo "Keeping required tunnel services enabled:"
for unit in "${required_services[@]}"; do
  if unit_exists "${unit}"; then
    run_or_show systemctl enable --now "${unit}"
  fi
done

echo
echo "Stopping/disabling optional services that are not needed for the tunnel:"
for unit in "${optional_services[@]}"; do
  if ! unit_exists "${unit}"; then
    continue
  fi
  if is_required "${unit}"; then
    continue
  fi

  run_or_show systemctl disable --now "${unit}"
done

echo
echo "Applying conservative power profile:"
if command -v powerprofilesctl >/dev/null 2>&1; then
  run_or_show powerprofilesctl set power-saver
elif compgen -G '/sys/devices/system/cpu/cpu*/cpufreq/scaling_governor' >/dev/null; then
  for governor in /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor; do
    if [[ "${apply}" == "true" ]]; then
      echo powersave >"${governor}" || true
    else
      echo "DRY RUN: echo powersave > ${governor}"
    fi
  done
else
  echo "No supported CPU power profile control found."
fi

echo
echo "Disabling Wi-Fi/Bluetooth radios only if rfkill is available and Ethernet/Tailscale remain active:"
if command -v rfkill >/dev/null 2>&1; then
  if ip route get 1.1.1.1 >/dev/null 2>&1; then
    run_or_show rfkill block bluetooth
  else
    echo "Skipping radio changes because no default route is visible."
  fi
else
  echo "rfkill is not installed; skipping radio changes."
fi

echo
echo "Docker cleanup:"
if command -v docker >/dev/null 2>&1; then
  run_or_show docker image prune -f
else
  echo "Docker is not installed."
fi

echo
echo "Energy policy check complete."
