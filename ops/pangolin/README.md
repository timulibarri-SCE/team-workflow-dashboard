# Lion-HopVAC Pangolin/Newt Setup

Status: superseded. Use the self-hosted FRP implementation in `ops/frp/`
instead. These Pangolin/Newt files are retained only as historical reference
and should not be deployed for the current tunnel.

This folder contains the public-resource blueprint for routing the Facilities
Engineering frontend path to FUXA through Pangolin/Newt.

## Required Outcome

- User page: `https://www.facilities-engineering.com/lion-HopVAC/`
- Browser-visible iframe path: `/lion-hopvac-proxy/`
- No ABM Lion BMS server IP address or private hostname in frontend code.
- No Cloud Gateway Max port forward to the BMS/FUXA server.

## GitHub Pages Limitation

GitHub Pages cannot reverse-proxy `/lion-hopvac-proxy/`.

For the same-domain path design to work, `www.facilities-engineering.com` must
be served by a front door that can route paths, such as Pangolin or another
reverse proxy. DNS cannot split traffic by URL path.

There are two viable deployment shapes:

1. Move `www.facilities-engineering.com` to Pangolin or another reverse proxy.
   Route `/lion-hopvac-proxy/` to FUXA through Newt and route the static site
   paths to the static site host.
2. Keep the static site on GitHub Pages and use a dedicated Pangolin subdomain
   for FUXA, then update the iframe to that subdomain. This still hides the
   server IP address, but the iframe URL is no longer same-domain.

The current frontend is written for option 1.

## Pangolin Dashboard Steps

1. Create a Newt site named `lion-hopvac-abm-bms`.
2. Copy the generated endpoint, Newt ID, and Newt secret.
3. Create or import the public resource from
   `lion-hopvac-public-resource.blueprint.example.yml`.
4. Confirm the public resource has:
   - `full-domain`: `www.facilities-engineering.com`
   - `path`: `/lion-hopvac-proxy`
   - `path-match`: `prefix`
   - `rewrite-match`: `stripPrefix`
   - target site: `lion-hopvac-abm-bms`
   - target hostname: `localhost`
   - target port: the local FUXA web port
5. Confirm Pangolin authentication protects the public resource.

## Newt Host Steps

On the ABM Lion BMS Linux host:

1. Confirm shell access to the Linux host.
2. Confirm FUXA responds locally on port `1881`.
3. Copy the `ops/newt` and `ops/pangolin` folders to the host.
4. From `ops/newt`, run `./bootstrap-lion-hopvac-newt.sh`.
5. Put the real Pangolin endpoint, Newt ID, and Newt secret into `.env`.
6. Rerun `./bootstrap-lion-hopvac-newt.sh`.
7. Verify the site shows online in Pangolin.

If SSH is closed on the Linux host, enable it from a local console first:

```sh
sudo apt update
sudo apt install -y openssh-server
sudo systemctl enable --now ssh
sudo systemctl status ssh --no-pager
```

The SSH service is only for administration. Do not add the Linux host address
to frontend source code, documentation for public users, or browser-visible
navigation.

## Validation

1. Load `https://www.facilities-engineering.com/lion-HopVAC/`.
2. Confirm the browser address bar stays on the Facilities Engineering domain.
3. Confirm iframe requests use `/lion-hopvac-proxy/`.
4. Confirm no ABM Lion BMS IP address or private hostname appears in page
   source, browser navigation, or frontend JavaScript.
