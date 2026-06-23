# Lion MD2Service Remote Access

This folder records the deployment pieces for exposing the Lion Systems web UI
at:

```text
https://md2service.facilities-engineering.com/
```

DNS is case-insensitive, so configure the hostname as lowercase even when the
requested user-facing name is written as `MD2Service.facilities-engineering.com`.

## Origin

- Server: Lion
- User-facing module: Systems
- Local origin: `http://127.0.0.1:1881`
- Public hostname: `md2service.facilities-engineering.com`

Do not put the ABM Lion BMS private IP address or private hostname in frontend
code, public docs, GitHub Pages routes, or browser-visible links.

## Cloudflare

Use Cloudflare Tunnel on the Lion server as the preferred public path. Apply
`md2service-cloudflared-tunnel.example.yml` as `/etc/cloudflared/config.yml`
after replacing the tunnel ID and credentials path with the real values.

Required Cloudflare DNS state:

```text
md2service.facilities-engineering.com -> Cloudflare Tunnel for Lion MD2Service
```

Protect the hostname with Cloudflare Access or the Systems application's own
authentication before relying on it for production operations.

## Tailscale

Use Tailscale Serve for tailnet-only administration and verification:

```sh
sudo ./configure-md2service-tailscale.sh
```

That script points Tailscale Serve at `http://127.0.0.1:1881`. If a temporary
public Tailscale URL is needed during Cloudflare work, run it with:

```sh
ENABLE_FUNNEL=true sudo ./configure-md2service-tailscale.sh
```

Cloudflare Tunnel remains the preferred public route for the custom Facilities
Engineering hostname. Do not expose BACnet/IP, SSH, databases, or arbitrary TCP
services through this route.

## GitHub Pages Shell

`lion-HopVAC/index.html` loads the controller iframe from
`https://md2service.facilities-engineering.com/` when the public shell is hosted
from `www.facilities-engineering.com`. GitHub Pages still owns `www`; do not
point `www.facilities-engineering.com` at the Lion server.

## Validation

Run these checks on or near the Lion server after applying the live Cloudflare
and Tailscale configuration:

```sh
curl -fsS http://127.0.0.1:1881/ >/dev/null
tailscale serve status
curl -I https://md2service.facilities-engineering.com/
```

Then open:

```text
https://www.facilities-engineering.com/lion-HopVAC/
```

Confirm the page source and browser network panel do not contain a private BMS
server IP address or private hostname.
