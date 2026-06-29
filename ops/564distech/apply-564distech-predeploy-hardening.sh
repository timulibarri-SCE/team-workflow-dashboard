#!/usr/bin/env bash
set -euo pipefail

HOST_GUARD="${HOST_GUARD:-564Distech}"
ETHERNET_CONNECTION="${ETHERNET_CONNECTION:-netplan-eno1}"

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run as root: sudo $0" >&2
  exit 1
fi

actual_host="$(hostname)"
if [[ "${actual_host,,}" != "${HOST_GUARD,,}" && "${ALLOW_OTHER_HOST:-false}" != "true" ]]; then
  echo "Refusing to run on ${actual_host}; expected ${HOST_GUARD}." >&2
  echo "Set ALLOW_OTHER_HOST=true only if you are intentionally testing elsewhere." >&2
  exit 1
fi

echo "Hardening ${actual_host} for controller-tunnel deployment."

if command -v nmcli >/dev/null 2>&1 && nmcli connection show "${ETHERNET_CONNECTION}" >/dev/null 2>&1; then
  nmcli connection modify "${ETHERNET_CONNECTION}" \
    connection.autoconnect yes \
    connection.autoconnect-priority 100 \
    connection.metered no \
    ipv4.method auto \
    ipv4.may-fail no \
    ipv6.method disabled
  systemctl enable NetworkManager.service >/dev/null
  systemctl enable NetworkManager-wait-online.service >/dev/null || true
fi

install -d -m 0755 /etc/systemd/logind.conf.d
cat >/etc/systemd/logind.conf.d/564distech-no-sleep.conf <<'CONF'
[Login]
HandleLidSwitch=ignore
HandleLidSwitchExternalPower=ignore
HandleLidSwitchDocked=ignore
IdleAction=ignore
IdleActionSec=0
CONF

systemctl restart systemd-logind.service || true
systemctl mask sleep.target suspend.target hibernate.target hybrid-sleep.target >/dev/null

install -d -m 0755 /etc/systemd/system/cloudflared.service.d
cat >/etc/systemd/system/cloudflared.service.d/10-564distech-resilience.conf <<'CONF'
[Unit]
Wants=network-online.target NetworkManager-wait-online.service tailscaled.service
After=network-online.target NetworkManager-wait-online.service tailscaled.service
StartLimitIntervalSec=0

[Service]
Restart=always
RestartSec=10s
CONF

install -d -m 0755 /etc/NetworkManager/dispatcher.d
cat >/etc/NetworkManager/dispatcher.d/90-564distech-tunnel-refresh <<'CONF'
#!/bin/sh
interface="$1"
action="$2"

case "${interface}:${action}" in
  eno1:up|eno1:dhcp4-change|eno1:connectivity-change|*:connectivity-change)
    systemctl try-restart cloudflared.service >/dev/null 2>&1 || true
    ;;
esac
CONF
chmod 0755 /etc/NetworkManager/dispatcher.d/90-564distech-tunnel-refresh

systemctl daemon-reload
systemctl restart cloudflared.service

if command -v ufw >/dev/null 2>&1; then
  ufw default deny incoming >/dev/null
  ufw default allow outgoing >/dev/null
  ufw allow 41641/udp comment 'Tailscale direct UDP' >/dev/null || true
  ufw allow in on tailscale0 comment 'Tailscale tailnet traffic' >/dev/null || true
  ufw allow in on tailscale0 proto tcp to any port 22 comment '564Distech Tailscale SSH' >/dev/null || true
  ufw --force enable >/dev/null
fi

echo "Pre-deploy hardening complete."
echo
echo "Service state:"
systemctl --no-pager --plain is-active cloudflared tailscaled ssh NetworkManager
echo
echo "Firewall state:"
if command -v ufw >/dev/null 2>&1; then
  ufw status verbose
fi
