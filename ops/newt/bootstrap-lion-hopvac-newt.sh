#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

compose_file="docker-compose.yml"
env_file=".env"
blueprint_file="lion-hopvac-public-resource.yml"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is required on the Newt host before this script can start the tunnel." >&2
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "Docker Compose v2 is required. Install the Docker compose plugin, then rerun this script." >&2
  exit 1
fi

if [ ! -f "$compose_file" ]; then
  cp docker-compose.yml.example "$compose_file"
fi

if [ ! -f "$blueprint_file" ]; then
  if [ -f "../pangolin/lion-hopvac-public-resource.blueprint.example.yml" ]; then
    cp ../pangolin/lion-hopvac-public-resource.blueprint.example.yml "$blueprint_file"
  else
    echo "Missing Pangolin blueprint example. Copy it to $blueprint_file before starting Newt." >&2
    exit 1
  fi
fi

if [ ! -f "$env_file" ]; then
  cp newt.env.example "$env_file"
  cat >&2 <<'MSG'
Created .env from newt.env.example.

Edit .env with the real Pangolin endpoint, Newt ID, and Newt secret, then rerun:
  ./bootstrap-lion-hopvac-newt.sh
MSG
  exit 2
fi

if grep -Eq 'REPLACE_WITH_' "$env_file"; then
  cat >&2 <<'MSG'
.env still contains placeholder values.

Use the real Pangolin endpoint, Newt ID, and Newt secret from the Pangolin site,
then rerun:
  ./bootstrap-lion-hopvac-newt.sh
MSG
  exit 2
fi

if command -v curl >/dev/null 2>&1; then
  if ! curl -fsS --max-time 5 http://localhost:1881/ >/dev/null; then
    echo "Warning: FUXA did not respond on http://localhost:1881/ from this host." >&2
    echo "If FUXA uses a different local port, update $blueprint_file before starting Newt." >&2
  fi
fi

docker compose pull newt
docker compose up -d
docker compose ps

echo "Lion-HopVAC Newt tunnel start requested. Verify the site is online in Pangolin."
