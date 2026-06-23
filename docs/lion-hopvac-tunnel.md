# Lion-BMS Tunnel Plan

The current Lion-BMS public route target is Cloudflare Tunnel on the Lion
server for `md2service.facilities-engineering.com`. The self-hosted FRP
implementation in `ops/frp/` and `docs/frp-remote-access-tunnel.md` remains an
alternate tunnel reference.

## Required Browser Behavior

The Lion-BMS page must never expose the ABM Lion BMS server IP address or a
private control-network hostname in frontend code, browser navigation, links,
or iframe URLs.

Browser users should only see approved frontend routes such as:

```text
https://www.facilities-engineering.com/lion-HopVAC/
https://md2service.facilities-engineering.com/
```

Current hosting decision: GitHub Pages is the final owner of
`www.facilities-engineering.com`. Because GitHub Pages cannot reverse-proxy
`/lion-hopvac-proxy/`, that proxy path must not be routed through Lillypad,
FRP, Pangolin, or another server using the `www` hostname. Use a dedicated
non-`www` Systems proxy hostname for production remote access.

The current dedicated Lion Systems hostname is:

```text
md2service.facilities-engineering.com
```

DNS hostnames are case-insensitive; use the lowercase hostname in
configuration even when the user-facing request is written as
`MD2Service.facilities-engineering.com`.

`lion-HopVAC/index.html` now loads the production controller iframe from
`https://md2service.facilities-engineering.com/` when the shell is hosted from
GitHub Pages. The historical same-origin `/lion-hopvac-proxy/` path remains
approved only for local or alternate deployments that explicitly serve that
proxy path.

When the page is opened from a local preview, `lion-HopVAC/index.html` shows a
status panel instead of blindly loading the unavailable same-domain proxy path.
This avoids a blank controller frame when company URL filtering blocks the
production domain. Use the displayed Systems route action when you need to test
the configured remote hostname directly.

The official product title is `Lion-BMS`. Lowercase strings such as
`lion-hopvac-proxy` are retained only as technical route and service identifiers
because they are already referenced by proxy configuration.

Floorplan navigation is configured in the public shell, not with direct private
links. See `docs/lion-systems-floorplans.md` for the `viewName` mapping used by
the Lion floor buttons.

The old same-domain path requires a cloud reverse proxy and is not compatible
with GitHub Pages owning `www`. The private building gateway can still run
`frpc` and initiate an outbound tunnel to a dedicated Systems proxy hostname.
For the MD2Service route, prefer Cloudflare Tunnel running on the Lion server
with the local Systems origin at `http://127.0.0.1:1881`. Tailscale Serve can
remain enabled for tailnet administration, and Tailscale Funnel can be used only
as an explicit temporary fallback.

## Site Firewall Position

Do not create an inbound port forward from the Cloud Gateway Max to the ABM
Lion BMS server.

The site gateway only needs outbound access to the cloud `frps` listener, using
the configured tunnel port. The cloud server does not need inbound connectivity
to the building site.

## Approved Services

Only reviewed HTTP services should be exposed through public tunnels:

- Local gateway dashboard
- Local BMS API
- Systems web UI

Do not expose raw BACnet/IP, UDP control protocols, arbitrary TCP ports, SSH,
RDP, or database ports through this tunnel.

## Deployment Reference

Use:

- `ops/lion/README.md`
- `ops/lion/md2service-cloudflared-tunnel.example.yml`
- `ops/lion/configure-md2service-tailscale.sh`
- `ops/frp/cloud/frps-site1.toml`
- `ops/frp/cloud/frps.service`
- `ops/frp/cloud/nginx-facilities-path.example.conf`
- `ops/frp/site-gateway/frpc-site1.toml`
- `ops/frp/site-gateway/frpc.service`

Keep all real tokens, credentials, and passwords in `/etc/cloudflared/`,
`/etc/frp/`, or the relevant service secret store on the target hosts, not in
the repository.

## Validation

1. Load the protected public route.
2. Confirm the browser address bar stays on the Facilities Engineering domain
   or an approved site subdomain.
3. Confirm iframe requests use only `md2service.facilities-engineering.com` or
   the explicitly configured local proxy path.
4. Confirm no ABM Lion BMS IP address or private hostname appears in page
   source, browser navigation, or frontend JavaScript.
5. Stop the active connector (`cloudflared`, `frpc.service`, or the temporary
   Tailscale Funnel) and confirm the route becomes unavailable.
6. Restart the connector and confirm the route recovers.
