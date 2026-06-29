#!/usr/bin/env bash
set -euo pipefail

theme_name="564distech-abm-openai"
script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
source_dir="${script_dir}/startup-branding"
theme_dir="/usr/share/plymouth/themes/${theme_name}"
host_name="$(hostname 2>/dev/null || true)"

if [[ ${EUID} -ne 0 ]]; then
  echo "Run this installer with sudo on 564Distech." >&2
  exit 1
fi

if [[ "${ALLOW_NON_564DISTECH_HOST:-false}" != "true" ]] && [[ ! "${host_name,,}" =~ 564distech ]]; then
  cat >&2 <<MSG
This startup branding installer is intended for 564Distech only.
Current hostname: ${host_name:-unknown}

If this is the correct host and it has a different local hostname, rerun with:
  ALLOW_NON_564DISTECH_HOST=true sudo ./install-564distech-startup-branding.sh
MSG
  exit 1
fi

if [[ ! -f "${source_dir}/abm-openai-startup.svg" ]]; then
  echo "Missing startup branding SVG at ${source_dir}/abm-openai-startup.svg" >&2
  exit 1
fi

install_packages() {
  if command -v apt-get >/dev/null 2>&1; then
    apt-get update
    DEBIAN_FRONTEND=noninteractive apt-get install -y plymouth plymouth-themes librsvg2-bin
  elif command -v dnf >/dev/null 2>&1; then
    dnf install -y plymouth plymouth-plugin-script librsvg2-tools
  elif command -v yum >/dev/null 2>&1; then
    yum install -y plymouth plymouth-plugin-script librsvg2-tools
  else
    echo "No supported package manager found for Plymouth startup branding." >&2
    exit 1
  fi
}

install_packages

if ! command -v rsvg-convert >/dev/null 2>&1; then
  echo "rsvg-convert is required to create the Plymouth PNG asset." >&2
  exit 1
fi

install -d -m 0755 "${theme_dir}"
install -m 0644 "${source_dir}/${theme_name}.plymouth" "${theme_dir}/${theme_name}.plymouth"
install -m 0644 "${source_dir}/${theme_name}.script" "${theme_dir}/${theme_name}.script"
install -m 0644 "${source_dir}/abm-openai-startup.svg" "${theme_dir}/abm-openai-startup.svg"
rsvg-convert -w 1920 -h 1080 "${source_dir}/abm-openai-startup.svg" -o "${theme_dir}/abm-openai-startup.png"
chmod 0644 "${theme_dir}/abm-openai-startup.png"

if command -v plymouth-set-default-theme >/dev/null 2>&1; then
  plymouth-set-default-theme "${theme_name}"
elif command -v update-alternatives >/dev/null 2>&1; then
  update-alternatives --install /usr/share/plymouth/themes/default.plymouth default.plymouth "${theme_dir}/${theme_name}.plymouth" 100
  update-alternatives --set default.plymouth "${theme_dir}/${theme_name}.plymouth"
fi

if command -v update-initramfs >/dev/null 2>&1; then
  update-initramfs -u
elif command -v dracut >/dev/null 2>&1; then
  dracut -f
fi

cat <<MSG
Installed ${theme_name} startup branding for 564Distech.

Preview on the next reboot. To test interactively on the local console:
  sudo plymouthd --debug --tty=\$(tty)
  sudo plymouth show-splash
  sudo plymouth quit
MSG
