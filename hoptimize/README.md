# Hoptimize

Hoptimize is a local Linux operations agent for controlled administrative
actions on a building gateway/server. It exposes a FastAPI API with bearer-token
authentication, role-based access control, fixed action allowlists, and a local
SQLite audit log.

It is not a remote shell. It never accepts arbitrary shell commands and does not
expose raw BACnet/IP or direct building-control protocols.

## First Release Scope

Implemented:

- `GET /health`
- `GET /v1/system/info`
- `GET /v1/network/status`
- `GET /v1/services`
- `GET /v1/services/{service_name}/status`
- `POST /v1/services/{service_name}/restart`
- `GET /v1/services/{service_name}/logs?lines=200`
- `GET /v1/docker/status`
- `POST /v1/docker/containers/{container_name}/restart`
- `GET /v1/frp/status`
- `POST /v1/frp/restart`
- `GET /v1/audit`
- `GET /v1/actions`

Guarded but not destructive:

- `POST /v1/deploy/compose`
- `POST /v1/frp/rotate-token`

Compose deployment, FRP token rotation, and reverse-proxy reload are deliberately
not implemented as real changes in the first safe release.

## Roles

- `viewer`: health, system info, network status, service status, capped logs,
  Docker status, FRP status.
- `operator`: viewer permissions plus approved service/container restarts.
- `admin`: operator permissions plus audit reads and guarded future deployment
  actions.
- `owner`: future capability-management owner.

## Security Model

- Every endpoint except `/health` requires a bearer token.
- First release uses local HS256 JWT validation.
- Tokens must include `sub` and a role claim, for example `role=operator`.
- All system actions are fixed command arrays, never shell strings.
- Unknown actions, services, containers, and compose stacks are rejected.
- Logs are capped to configured line counts and summaries are redacted.
- Every successful protected action writes an audit row with request ID,
  requester, role, source IP, action, target, command, status, stdout summary,
  and stderr summary.
- Use Authentik or another gateway in front of Hoptimize before exposing it
  beyond localhost or a private management network.

## Install

Create the service user:

```sh
sudo useradd --system --home-dir /var/lib/hoptimize --shell /usr/sbin/nologin hoptimize
sudo install -d -m 0750 -o hoptimize -g hoptimize /etc/hoptimize /var/lib/hoptimize /var/log/hoptimize /opt/hoptimize
```

Install the app:

```sh
sudo rsync -a hoptimize/app hoptimize/requirements.txt /opt/hoptimize/
sudo python3 -m venv /opt/hoptimize/.venv
sudo /opt/hoptimize/.venv/bin/pip install -r /opt/hoptimize/requirements.txt
sudo chown -R hoptimize:hoptimize /opt/hoptimize /var/lib/hoptimize /var/log/hoptimize
```

Configure environment:

```sh
sudo install -m 0640 -o root -g hoptimize examples/hoptimize.env.example /etc/hoptimize/hoptimize.env
openssl rand -base64 48
sudo editor /etc/hoptimize/hoptimize.env
```

Replace `HOPTIMIZE_JWT_SECRET`, review allowed services/containers, and keep
the API bound to `127.0.0.1` unless there is a reverse proxy with real auth in
front of it.

Install systemd service:

```sh
sudo install -m 0644 examples/hoptimize.service /etc/systemd/system/hoptimize.service
sudo systemctl daemon-reload
sudo systemctl enable --now hoptimize.service
sudo systemctl status hoptimize.service --no-pager
```

## Sudoers

Install sudoers with `visudo`, then edit the exact commands to match the
services actually approved for this gateway:

```sh
sudo visudo -f /etc/sudoers.d/hoptimize
```

Paste from `examples/sudoers-hoptimize.example`.

Do not add wildcard unrestricted `systemctl`, `journalctl`, shell, editor, file
copy, or package-manager permissions.

## JWT Test Token

For local testing, create a short-lived operator token from the same machine
where the secret is available:

```sh
cd /opt/hoptimize
set -a
. /etc/hoptimize/hoptimize.env
set +a
/opt/hoptimize/.venv/bin/python - <<'PY'
import datetime
import os
import jwt

secret = os.environ["HOPTIMIZE_JWT_SECRET"]
payload = {
    "sub": "local-operator",
    "role": "operator",
    "exp": datetime.datetime.utcnow() + datetime.timedelta(minutes=30),
}
print(jwt.encode(payload, secret, algorithm="HS256"))
PY
```

## Curl Tests

Health is open:

```sh
curl -fsS http://127.0.0.1:8090/health
```

Protected endpoints reject missing auth:

```sh
curl -i http://127.0.0.1:8090/v1/services
```

Authenticated reads:

```sh
TOKEN=replace-with-jwt
curl -fsS -H "Authorization: Bearer $TOKEN" http://127.0.0.1:8090/v1/services
curl -fsS -H "Authorization: Bearer $TOKEN" http://127.0.0.1:8090/v1/services/frpc/status
curl -fsS -H "Authorization: Bearer $TOKEN" "http://127.0.0.1:8090/v1/services/frpc/logs?lines=200"
```

Dry-run restart:

```sh
curl -fsS \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"dry_run": true}' \
  http://127.0.0.1:8090/v1/services/frpc/restart
```

Real restart for an operator/admin token:

```sh
curl -fsS \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"dry_run": false}' \
  http://127.0.0.1:8090/v1/frp/restart
```

Read audit with an admin token:

```sh
curl -fsS -H "Authorization: Bearer $ADMIN_TOKEN" http://127.0.0.1:8090/v1/audit
```

## Authentik Later

The first release validates local JWTs. To connect Authentik cleanly:

1. Put Hoptimize behind an Authentik outpost or reverse proxy.
2. Issue JWTs with a `sub` and a role/group claim.
3. Keep Hoptimize bound to localhost or a private interface.
4. Extend `app/auth.py` to validate Authentik JWKS and issuer/audience.
5. Map Authentik groups to `viewer`, `operator`, `admin`, or `owner`.

Do not expose Hoptimize directly to the internet.

## Acceptance Tests

Manual:

1. `GET /health` returns `{"status":"ok"}` without auth.
2. `GET /v1/services` returns `401` without a bearer token.
3. A `viewer` token can read service status.
4. A `viewer` token receives `403` when restarting a service.
5. An `operator` token can restart `frpc`.
6. Restarting an unknown service returns `404`.
7. There is no endpoint that accepts arbitrary commands.
8. Log output is capped to configured line values and redacts secret patterns.
9. `GET /v1/audit` shows successful protected actions.
10. `systemctl is-enabled hoptimize.service` confirms reboot survival.
11. Stop `frpc`, restart it through Hoptimize, and confirm tunnel recovery.

Automated tests:

```sh
cd hoptimize
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
pytest
```

## Operational Warnings

- Hoptimize is not a shell and must never become one.
- Keep sudoers exact. Do not add `/usr/bin/systemctl *`.
- Do not allow package installation, arbitrary file writes, or shell execution.
- Do not tunnel raw BACnet/IP or field-bus protocols through Hoptimize.
- Keep JWT secrets, service env files, and audit databases out of git.
- Review `GET /v1/actions` before adding any new capability.
