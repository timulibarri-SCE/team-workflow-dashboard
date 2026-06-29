# 564Distech Controller Remote Access

This folder records the deployment pieces for exposing the 564 Pacific Distech
controller through the `564Distech` tunnel host.

## Origin

- Tunnel host: `564Distech`
- Tailscale name: `564distech.taileed3dc.ts.net`
- User-facing module: Systems
- Local controller origin: `http://127.0.0.1/` by default
- Public hostname: `564distech.facilities-engineering.com`

If the Distech controller web UI listens on another local port or on another
site-local address reachable from `564Distech`, set `DISTECH_564_ORIGIN` before
running the helper scripts and update the Cloudflare config service target.

Do not expose BACnet/IP, raw controller protocols, SSH, RDP, databases, or
arbitrary TCP services through this route. Only the reviewed HTTP controller UI
should be published.

## Tailscale

`564Distech` must remain visible in the tailnet before any public tunnel is
trusted. Verify from an admin workstation with:

```sh
tailscale status
tailscale ping 564distech
```

## Software Bootstrap

Run the software bootstrap once on `564Distech` to install the tools needed for
the tunnel host:

```sh
sudo ./install-564distech-software.sh
```

The bootstrap installs or enables:

- Tailscale and `tailscaled`
- Docker Engine and Docker Compose plugin
- Cloudflare `cloudflared`
- Git, curl, jq, certificates, GPG tooling, and OpenSSH server

After the bootstrap finishes, keep the Tailscale login and Cloudflare tunnel
token setup on `564Distech`; do not commit tokens or credentials to GitHub.

## Updates And Energy

Check pending updates and current power/process state without changing the
host:

```sh
sudo ./audit-564distech-updates-and-power.sh
```

Refresh package metadata during the audit:

```sh
REFRESH_PACKAGE_INDEX=true sudo ./audit-564distech-updates-and-power.sh
```

Show pending updates without installing them:

```sh
sudo ./update-564distech-software.sh
```

Install updates and refresh the tunnel container image:

```sh
APPLY_UPDATES=true sudo ./update-564distech-software.sh
```

Preview which optional services can be powered down:

```sh
sudo ./apply-564distech-energy-policy.sh
```

Apply the conservative energy policy:

```sh
APPLY_ENERGY_POLICY=true sudo ./apply-564distech-energy-policy.sh
```

The energy policy keeps `tailscaled`, Docker, SSH, and the
`564distech-cloudflared` service enabled. It only targets optional services
such as Bluetooth, printing, local service discovery, modem management,
PackageKit, and Snap when they exist on the host.

Use Tailscale Serve for tailnet-only administration and verification:

```sh
sudo ./configure-564distech-tailscale.sh
```

If the controller origin is not `http://127.0.0.1/`, pass it explicitly:

```sh
DISTECH_564_ORIGIN=http://127.0.0.1:8080 sudo ./configure-564distech-tailscale.sh
```

Cloudflare Tunnel remains the preferred public route for the custom Facilities
Engineering hostname. Use Tailscale Funnel only as a temporary fallback during
Cloudflare work:

```sh
ENABLE_FUNNEL=true sudo ./configure-564distech-tailscale.sh
```

## Cloudflare

Use Cloudflare Tunnel on `564Distech` as the preferred public path. Apply
`564distech-cloudflared-tunnel.example.yml` as `/etc/cloudflared/config.yml`
after replacing the tunnel ID, credentials path, and origin URL with the real
values.

If `cloudflared` is not installed as a system service, run the Docker-based
tunnel from this folder instead:

```sh
cp cloudflared.env.example cloudflared.env
$EDITOR cloudflared.env
./start-564distech-cloudflared.sh
```

The Cloudflare Zero Trust tunnel token must stay in `cloudflared.env` on
`564Distech` only.

## Power Recovery

To make the tunnel come back automatically after power loss or reboot, install
the systemd autostart unit on `564Distech` after `cloudflared.env` is set:

```sh
sudo ./install-564distech-autostart.sh
```

The installer enables Docker at boot, creates
`/etc/systemd/system/564distech-cloudflared.service`, starts the tunnel, and
enables the service for `multi-user.target`. The Docker container also uses
`restart: always`, so the connector is relaunched if the container exits after
the host is already running.

Required Cloudflare DNS state:

```text
564distech.facilities-engineering.com -> Cloudflare Tunnel for 564Distech
```

Protect the hostname with Cloudflare Access or the controller application's own
authentication before relying on it for production operations.

## Validation

Run these checks on or near `564Distech` after applying the live Cloudflare and
Tailscale configuration:

```sh
curl -fsS "${DISTECH_564_ORIGIN:-http://127.0.0.1/}" >/dev/null
tailscale serve status
curl -I https://564distech.facilities-engineering.com/
```

Then confirm browser users only see approved Facilities Engineering routes, not
private controller addresses.
