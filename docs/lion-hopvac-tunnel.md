# Lion-HopVAC Tunnel Plan

The current Lion-HopVAC tunnel target is the self-hosted FRP implementation in
`ops/frp/` and `docs/frp-remote-access-tunnel.md`.

## Required Browser Behavior

The Lion-HopVAC page must never expose the ABM Lion BMS server IP address or a
private control-network hostname in frontend code, browser navigation, links,
or iframe URLs.

Browser users should only see approved frontend routes such as:

```text
https://www.facilities-engineering.com/lion-HopVAC/
https://www.facilities-engineering.com/lion-hopvac-proxy/
```

The frontend iframe remains path-based:

```js
const HOPVAC_PROXY_PATH = "/lion-hopvac-proxy/";
```

When the page is opened from a local preview, `lion-HopVAC/index.html` points
the iframe to `https://www.facilities-engineering.com/lion-hopvac-proxy/`.
When it is hosted on the Facilities Engineering domain, it uses the same-domain
path `/lion-hopvac-proxy/`.

The official product title is `HopVAC`. Lowercase strings such as
`lion-hopvac-proxy` are retained only as technical route and service identifiers
because they are already referenced by proxy configuration.

That path must be served by a cloud reverse proxy, such as Nginx, which can
route the request to a local-only `frps` HTTP vhost listener. The private
building gateway runs `frpc` and initiates the outbound tunnel to the cloud.

## Site Firewall Position

Do not create an inbound port forward from the Cloud Gateway Max to the ABM
Lion BMS server.

The site gateway only needs outbound access to the cloud `frps` listener, using
the configured tunnel port. The cloud server does not need inbound connectivity
to the building site.

## Approved Services

Only reviewed HTTP services should be exposed through FRP:

- Local gateway dashboard
- Local BMS API
- Optional FUXA web UI

Do not expose raw BACnet/IP, UDP control protocols, arbitrary TCP ports, SSH,
RDP, or database ports through this tunnel.

## Deployment Reference

Use:

- `ops/frp/cloud/frps-site1.toml`
- `ops/frp/cloud/frps.service`
- `ops/frp/cloud/nginx-facilities-path.example.conf`
- `ops/frp/site-gateway/frpc-site1.toml`
- `ops/frp/site-gateway/frpc.service`

Keep all real tokens and passwords in `/etc/frp/` on the target hosts, not in
the repository.

## Validation

1. Load the protected public route.
2. Confirm the browser address bar stays on the Facilities Engineering domain
   or an approved site subdomain.
3. Confirm iframe requests use only the frontend proxy route.
4. Confirm no ABM Lion BMS IP address or private hostname appears in page
   source, browser navigation, or frontend JavaScript.
5. Stop `frpc.service` on the site gateway and confirm the route becomes
   unavailable.
6. Restart `frpc.service` and confirm the route recovers.
