# FRP Remote Access Tunnel

This implementation uses the official `frp` / `gofrp` project to reach private
site HTTP services through a public cloud Linux server without opening inbound
ports at the building.

## Architecture

```text
User browser
  -> HTTPS Nginx on the cloud server
  -> optional Authentik forward auth
  -> local frps HTTP vhost listener
  -> outbound frpc tunnel from the building gateway
  -> approved local HTTP service on the gateway
```

This is a tunnel layer only. Put Authentik, the main application login, or
another authorization layer in front of every browser-accessible route.

## Files

- `cloud/frps-site1.toml`: cloud `frps` config for the first site.
- `cloud/frps-site1.env.example`: non-secret and dashboard env template.
- `cloud/frps.service`: systemd service for the cloud tunnel server.
- `cloud/nginx-site1.example.com.conf`: Nginx HTTPS reverse proxy example.
- `cloud/nginx-facilities-path.example.conf`: optional same-domain path route
  for `/lion-hopvac-proxy/`.
- `cloud/nginx-authentik-forward-auth.example.conf`: optional Authentik notes.
- `cloud/check-frps-health.sh`: basic cloud-side health check.
- `site-gateway/frpc-site1.toml`: site gateway `frpc` config.
- `site-gateway/frpc-site1.env.example`: site identity and route template.
- `site-gateway/frpc.service`: systemd service for the building gateway.
- `site-gateway/demo-http.service`: local demo service for acceptance testing.
- `site-gateway/check-frpc-health.sh`: basic site-side health check.

## Design Decisions

- Only HTTP proxy mode is used for site services.
- No raw BACnet/IP, UDP, Modbus, SSH, RDP, or arbitrary TCP ports are exposed.
- The building gateway initiates the outbound connection to cloud `frps`.
- Cloud Nginx terminates public HTTPS and proxies to a local-only `frps`
  vhost listener.
- The default is one `frps` config and token per building site. For many sites,
  either run one site-specific `frps` listener per site or move tunnel auth to
  OIDC client credentials.

## Install FRP

Install the same official `frp` release on the cloud server and site gateway.
Adjust architecture if not `linux_amd64`.

```sh
FRP_VERSION=0.69.0
curl -LO "https://github.com/fatedier/frp/releases/download/v${FRP_VERSION}/frp_${FRP_VERSION}_linux_amd64.tar.gz"
tar -xzf "frp_${FRP_VERSION}_linux_amd64.tar.gz"
sudo install -m 0755 "frp_${FRP_VERSION}_linux_amd64/frps" /usr/local/bin/frps
sudo install -m 0755 "frp_${FRP_VERSION}_linux_amd64/frpc" /usr/local/bin/frpc
```

Create the service user and directories on both hosts:

```sh
sudo useradd --system --home-dir /var/lib/frp --shell /usr/sbin/nologin frp
sudo install -d -m 0750 -o frp -g frp /etc/frp /etc/frp/tokens /var/log/frp /var/lib/frp
```

## Cloud Server Setup

Copy these files to the cloud server:

```sh
sudo install -m 0640 -o frp -g frp cloud/frps-site1.toml /etc/frp/frps-site1.toml
sudo install -m 0640 -o frp -g frp cloud/frps-site1.env.example /etc/frp/frps-site1.env
sudo install -m 0644 cloud/frps.service /etc/systemd/system/frps.service
sudo install -m 0755 cloud/check-frps-health.sh /usr/local/bin/check-frps-health
```

Generate a strong site token on the cloud server:

```sh
openssl rand -base64 48 | sudo tee /etc/frp/tokens/site1.token >/dev/null
sudo chown frp:frp /etc/frp/tokens/site1.token
sudo chmod 0600 /etc/frp/tokens/site1.token
```

Edit `/etc/frp/frps-site1.env` and replace the dashboard password. Keep the
same token in `/etc/frp/tokens/site1.token` on the building gateway.

Validate and start. The systemd unit runs `frps verify` with the configured
`EnvironmentFile` before starting the service.

```sh
sudo systemctl daemon-reload
sudo systemctl enable --now frps.service
sudo systemctl status frps.service --no-pager
```

Install Nginx and copy the route:

```sh
sudo install -m 0644 cloud/nginx-site1.example.com.conf /etc/nginx/sites-available/site1.example.com.conf
sudo ln -s /etc/nginx/sites-available/site1.example.com.conf /etc/nginx/sites-enabled/site1.example.com.conf
sudo nginx -t
sudo systemctl reload nginx
```

Replace `site1.example.com` and certificate paths before enabling the Nginx
site. If Authentik is already available, merge the optional forward-auth
snippet before exposing any real control UI.

Do not route `www.facilities-engineering.com` through FRP. GitHub Pages is the
final owner of `www`, so the path-based example in
`cloud/nginx-facilities-path.example.conf` is historical only. Use a dedicated
non-`www` Systems proxy hostname, such as
`md2service.facilities-engineering.com`, and set `FRP_PUBLIC_HOST` to that
hostname.

## Site Gateway Setup

Copy these files to the private Linux gateway:

```sh
sudo install -m 0640 -o frp -g frp site-gateway/frpc-site1.toml /etc/frp/frpc-site1.toml
sudo install -m 0640 -o frp -g frp site-gateway/frpc-site1.env.example /etc/frp/frpc-site1.env
sudo install -m 0644 site-gateway/frpc.service /etc/systemd/system/frpc.service
sudo install -m 0755 site-gateway/check-frpc-health.sh /usr/local/bin/check-frpc-health
```

Copy the site token from the cloud server to the site gateway using a secure
method, then set file ownership:

```sh
sudo install -m 0600 -o frp -g frp site1.token /etc/frp/tokens/site1.token
```

Edit `/etc/frp/frpc-site1.env`:

- `FRP_SERVER_ADDR`: public DNS name of the cloud server.
- `FRP_PUBLIC_HOST`: public route, for example
  `md2service.facilities-engineering.com`.
- `FRP_LOCAL_SERVICE_HOST`: usually `127.0.0.1`.
- `FRP_LOCAL_SERVICE_PORT`: demo is `8080`; Systems might be `1881`.

Validate and start. The systemd unit runs `frpc verify` with the configured
`EnvironmentFile` before starting the service.

```sh
sudo systemctl daemon-reload
sudo systemctl enable --now frpc.service
sudo systemctl status frpc.service --no-pager
```

## Firewall Notes

Cloud server inbound:

- TCP `443`: public HTTPS through Nginx.
- TCP `80`: optional ACME/cert redirect only.
- TCP `7000`: `frpc` clients connect to `frps`.
- TCP `22`: admin SSH, restricted to admin source IPs if possible.

Cloud server local-only:

- TCP `8088`: `frps` HTTP vhost listener, proxied by Nginx only.
- TCP `7500`: `frps` dashboard on `127.0.0.1`.

Building gateway inbound:

- No inbound firewall opening is required for the tunnel.
- Keep BACnet/IP and other field-bus ports private.

Building gateway outbound:

- TCP `7000` to the cloud server.
- DNS and normal OS update traffic as needed.

## Logging

Cloud:

```sh
journalctl -u frps.service -f
sudo tail -f /var/log/frp/frps-site1.log
check-frps-health site1 site1.example.com 7000 8088
```

Site gateway:

```sh
journalctl -u frpc.service -f
sudo tail -f /var/log/frp/frpc-site1.log
check-frpc-health site1 gateway-dashboard 127.0.0.1 8080
```

The systemd units log start/stop events with site ID, exposed local service,
and public route. FRP logs registration and disconnect events for the named
proxy, for example `lion-md2service-systems`.

## Acceptance Test

On the site gateway, start a local-only demo service:

```sh
sudo install -d -m 0755 /opt/frp-demo
printf 'FRP demo for site1\n' | sudo tee /opt/frp-demo/index.html
sudo install -m 0644 site-gateway/demo-http.service /etc/systemd/system/frp-demo-http.service
sudo systemctl daemon-reload
sudo systemctl enable --now frp-demo-http.service
curl -fsS http://127.0.0.1:8080/
```

Run the test:

1. Start `frps.service` on the cloud server.
2. Start `frpc.service` on the building gateway.
3. Visit `https://site1.example.com` from a browser.
4. Confirm the demo service loads through the tunnel.
5. Confirm the building gateway has no inbound firewall port opened.
6. Stop the gateway client: `sudo systemctl stop frpc.service`.
7. Confirm `https://site1.example.com` becomes unavailable.
8. Restart the gateway client: `sudo systemctl start frpc.service`.
9. Confirm `https://site1.example.com` works again.
10. Confirm no raw BACnet ports are exposed:

```sh
sudo ss -lntup | grep -E ':(47808|47809)\b' && echo "BACnet exposed: investigate" || echo "No BACnet listener exposed"
grep -RInE 'type = "tcp"|type = "udp"|47808|47809|remotePort' /etc/frp || true
```

## Troubleshooting

Cloud:

```sh
sudo frps verify -c /etc/frp/frps-site1.toml
sudo systemctl status frps.service --no-pager
sudo ss -ltnp | grep -E ':(7000|8088|7500)\b'
curl -I -H 'Host: site1.example.com' http://127.0.0.1:8088/
sudo nginx -t
```

Site gateway:

```sh
sudo frpc verify -c /etc/frp/frpc-site1.toml
sudo systemctl status frpc.service --no-pager
curl -fsS http://127.0.0.1:8080/
journalctl -u frpc.service -n 100 --no-pager
```

Common failures:

- `authorization failed`: token files do not match or permissions prevent read.
- `proxy name already in use`: change `FRP_SITE_ID` or proxy name.
- Nginx 502: `frps` vhost listener is not reachable on `127.0.0.1:8088`.
- Browser reaches FRP but not service: local gateway service is down or health
  check removed the proxy.
- Public route works without login: add Authentik or application auth before
  exposing any building controls.

## Security Notes

- Treat `/etc/frp/tokens/site1.token` as a production secret.
- Do not commit token files, `.env` files, dashboard passwords, building IPs,
  or internal control-network details.
- Use one token/config identity per site. Do not share site tokens.
- Use Authentik or application auth for browser users. FRP authenticates the
  tunnel, not the human using the browser.
- Keep `vhostHTTPPort` and dashboards bound to localhost on the cloud server.
- Keep the site gateway firewall closed to inbound internet traffic.
- Do not tunnel raw BACnet/IP. Expose only reviewed HTTP dashboards or APIs.
- Review every `[[proxies]]` block before deployment.
