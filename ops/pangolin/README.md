# Lion-BMS Pangolin/Newt Setup

Status: superseded. Use the self-hosted FRP implementation in `ops/frp/`
instead. These Pangolin/Newt files are retained only as historical reference
and should not be deployed for the current tunnel. They also predate the
decision that GitHub Pages is the final owner of
`www.facilities-engineering.com`; do not route `www` to Pangolin/Newt.

This folder contains the historical public-resource blueprint for routing the
Facilities Engineering frontend path to Systems through Pangolin/Newt.

## Required Outcome

- User page: `https://www.facilities-engineering.com/lion-HopVAC/`
- Browser-visible iframe route: `https://md2service.facilities-engineering.com/`
- No ABM Lion BMS server IP address or private hostname in frontend code.
- No Cloud Gateway Max port forward to the BMS or Systems server.

## GitHub Pages Limitation

GitHub Pages cannot reverse-proxy `/lion-hopvac-proxy/`.

For the same-domain path design to work, `www.facilities-engineering.com` would
have to be served by a front door that can route paths, such as Pangolin or
another reverse proxy. That is no longer the target model because GitHub Pages
owns `www`. DNS cannot split traffic by URL path.

The current viable deployment shape is:

1. Keep the static site on GitHub Pages and use
   `md2service.facilities-engineering.com` as the dedicated Systems hostname.
   This still hides the server IP address, but the iframe URL is no longer
   same-domain.

The current frontend has been updated for the dedicated MD2Service hostname.

## Pangolin Dashboard Steps

1. Create a Newt site named `lion-hopvac-abm-bms`.
2. Copy the generated endpoint, Newt ID, and Newt secret.
3. Create or import the public resource from
   `lion-hopvac-public-resource.blueprint.example.yml`.
4. Confirm the public resource has:
   - `full-domain`: `md2service.facilities-engineering.com`
   - `path`: `/lion-hopvac-proxy`
   - `path-match`: `prefix`
   - `rewrite-match`: `stripPrefix`
   - target site: `lion-hopvac-abm-bms`
   - target hostname: `localhost`
   - target port: the local Systems web port
5. Confirm Pangolin authentication protects the public resource.

## Newt Host Steps

On the ABM Lion BMS Linux host:

1. Confirm shell access to the Linux host.
2. Confirm Systems responds locally on port `1881`.
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

1. Load the approved non-`www` Systems proxy route.
2. Confirm the browser address bar does not expose a private hostname or IP.
3. Confirm iframe requests use the approved proxy hostname and path.
4. Confirm no ABM Lion BMS IP address or private hostname appears in page
   source, browser navigation, or frontend JavaScript.
