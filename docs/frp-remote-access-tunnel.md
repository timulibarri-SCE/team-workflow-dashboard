# FRP Remote Access Tunnel Record

This document records the self-hosted FRP implementation added for private
building gateway access.

## Current Implementation

- Public cloud tunnel server: `frps`
- Building gateway connector: `frpc`
- Public browser entry: Nginx HTTPS reverse proxy
- Optional browser authorization: Authentik forward auth, if already available
- Default site identity: `site1`
- Default public route: `site1.example.com`
- Default approved local service: HTTP on `127.0.0.1:8080`

## Repository Files

- `ops/frp/README.md`
- `ops/frp/cloud/frps-site1.toml`
- `ops/frp/cloud/frps-site1.env.example`
- `ops/frp/cloud/frps.service`
- `ops/frp/cloud/nginx-site1.example.com.conf`
- `ops/frp/cloud/nginx-facilities-path.example.conf`
- `ops/frp/cloud/nginx-authentik-forward-auth.example.conf`
- `ops/frp/cloud/check-frps-health.sh`
- `ops/frp/site-gateway/frpc-site1.toml`
- `ops/frp/site-gateway/frpc-site1.env.example`
- `ops/frp/site-gateway/frpc.service`
- `ops/frp/site-gateway/demo-http.service`
- `ops/frp/site-gateway/check-frpc-health.sh`

## Security Controls

- No custom tunnel protocol was added.
- Token files and env files are ignored by git.
- One tunnel identity/config is defined for one site.
- The building gateway initiates outbound traffic to the cloud server.
- The cloud server does not initiate inbound traffic to the building gateway.
- Nginx terminates public HTTPS.
- FRP HTTP vhost and dashboards are bound to localhost on the cloud server.
- Raw BACnet/IP is explicitly excluded.

## Required Deployment Values

Before production deployment, replace:

- `site1.example.com`
- `frp.example.com`
- TLS certificate paths
- `/etc/frp/tokens/site1.token`
- FRP dashboard/admin passwords
- Local service port, if not `8080`

## Acceptance

Acceptance requires proving:

1. The local demo service responds on the building gateway at `127.0.0.1:8080`.
2. `frpc` connects outbound to cloud `frps`.
3. `https://site1.example.com` loads through Nginx and FRP.
4. The building gateway has no inbound firewall rule opened for this tunnel.
5. Stopping `frpc.service` breaks the public route.
6. Starting `frpc.service` restores the route.
7. No BACnet ports or raw TCP/UDP control protocols are exposed.
