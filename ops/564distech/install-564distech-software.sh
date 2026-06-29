#!/usr/bin/env bash
set -euo pipefail

if [[ ${EUID} -ne 0 ]]; then
  echo "Run this installer with sudo on 564Distech." >&2
  exit 1
fi

if [[ -r /etc/os-release ]]; then
  # shellcheck disable=SC1091
  . /etc/os-release
else
  ID="unknown"
  VERSION_CODENAME=""
fi

log() {
  printf '\n==> %s\n' "$*"
}

install_tailscale() {
  if command -v tailscale >/dev/null 2>&1; then
    log "Tailscale is already installed"
  else
    log "Installing Tailscale"
    curl -fsSL https://tailscale.com/install.sh | sh
  fi

  if command -v systemctl >/dev/null 2>&1; then
    systemctl enable --now tailscaled.service
  fi
}

install_debian_family() {
  log "Installing base packages"
  apt-get update
  DEBIAN_FRONTEND=noninteractive apt-get install -y \
    ca-certificates \
    curl \
    git \
    gnupg \
    jq \
    lsb-release \
    openssh-server

  log "Installing Docker Engine and Compose plugin"
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/${ID}/gpg -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc

  local codename="${VERSION_CODENAME:-$(lsb_release -cs)}"
  local arch
  arch="$(dpkg --print-architecture)"

  cat >/etc/apt/sources.list.d/docker.list <<EOF
deb [arch=${arch} signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/${ID} ${codename} stable
EOF

  apt-get update
  DEBIAN_FRONTEND=noninteractive apt-get install -y \
    containerd.io \
    docker-buildx-plugin \
    docker-ce \
    docker-ce-cli \
    docker-compose-plugin

  log "Installing cloudflared"
  install -m 0755 -d /usr/share/keyrings
  curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg \
    | tee /usr/share/keyrings/cloudflare-main.gpg >/dev/null

  cat >/etc/apt/sources.list.d/cloudflared.list <<'EOF'
deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] https://pkg.cloudflare.com/cloudflared any main
EOF

  apt-get update
  DEBIAN_FRONTEND=noninteractive apt-get install -y cloudflared
}

install_rpm_family() {
  local pm="yum"
  local docker_repo="https://download.docker.com/linux/centos/docker-ce.repo"
  if command -v dnf >/dev/null 2>&1; then
    pm="dnf"
  fi
  if [[ "${ID}" == "fedora" ]]; then
    docker_repo="https://download.docker.com/linux/fedora/docker-ce.repo"
  fi

  log "Installing base packages"
  "${pm}" install -y ca-certificates curl git jq openssh-server

  log "Installing Docker and Compose plugin"
  if [[ "${pm}" == "dnf" ]]; then
    "${pm}" install -y dnf-plugins-core || true
    "${pm}" config-manager --add-repo "${docker_repo}" || true
  else
    "${pm}" install -y yum-utils || true
    yum-config-manager --add-repo "${docker_repo}" || true
  fi

  if [[ "${ID}" == "amzn" ]]; then
    "${pm}" install -y docker docker-compose-plugin
  else
    "${pm}" install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  fi

  log "Installing cloudflared"
  curl -fsSL https://pkg.cloudflare.com/cloudflared.repo -o /etc/yum.repos.d/cloudflared.repo
  "${pm}" install -y cloudflared
}

case "${ID}" in
  debian|ubuntu|raspbian)
    install_debian_family
    ;;
  amzn|rhel|centos|fedora|rocky|almalinux)
    install_rpm_family
    ;;
  *)
    if command -v apt-get >/dev/null 2>&1; then
      ID="debian"
      install_debian_family
    elif command -v dnf >/dev/null 2>&1 || command -v yum >/dev/null 2>&1; then
      install_rpm_family
    else
      echo "Unsupported Linux distribution for this automatic installer: ${ID}" >&2
      exit 1
    fi
    ;;
esac

install_tailscale

log "Enabling services"
if command -v systemctl >/dev/null 2>&1; then
  systemctl enable --now docker.service

  if systemctl list-unit-files ssh.service --no-legend 2>/dev/null | grep -q '^ssh\.service'; then
    systemctl enable --now ssh.service
  elif systemctl list-unit-files sshd.service --no-legend 2>/dev/null | grep -q '^sshd\.service'; then
    systemctl enable --now sshd.service
  fi
fi

log "Installed versions"
git --version || true
docker --version || true
docker compose version || true
cloudflared --version || true
tailscale version || true

cat <<'MSG'

Software install complete for 564Distech.

Next steps on 564Distech:
1. Confirm Tailscale is logged in: tailscale status
2. Put the Cloudflare tunnel token in ops/564distech/cloudflared.env
3. Start the tunnel: ./start-564distech-cloudflared.sh
4. Enable power recovery: sudo ./install-564distech-autostart.sh
MSG
