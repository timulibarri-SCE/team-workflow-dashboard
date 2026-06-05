# Facilities Engineering SSO Information

This folder is the working repository for Facilities Engineering single sign-on
information. It records the intended access flow, configuration data to collect,
and implementation status for future authentication work.

## Current Status

- Public login entry point: `/login/`
- Access settings page: `/settings/`
- Homepage login button: enabled and pointed to `/login/`
- Identity provider: pending assignment
- SSO protocol: pending assignment
- Protected application backend: not yet connected
- Production authentication enforcement: not yet active

## Planned Access Flow

1. User selects `Login` from the Facilities Engineering site header.
2. Current static prototype checks the local access directory by email or SSO ID.
3. User sees the pages assigned to their local access record.
4. Future production version redirects the user to the approved identity provider.
5. Identity provider validates the user, MFA policy, and group assignment.
6. User returns to the authorized Facilities Engineering resource.
7. Access events are logged according to team policy.

## Configuration Details to Capture

- Identity provider name
- Identity provider administrator contact
- SSO protocol: SAML 2.0, OIDC, or enterprise SSO platform
- Issuer URL
- Metadata endpoint
- Client ID or entity ID
- Redirect URI or assertion consumer service endpoint
- Allowed callback domains
- Authorized user groups
- Session timeout policy
- MFA requirements
- Audit and logging requirements

## Site Integration Notes

- Static GitHub Pages can host the public login entry point and documentation.
- Static GitHub Pages can store browser-local demo access records, but those
  records are not secure authentication.
- Actual SSO enforcement requires an authentication-capable application layer,
  identity-aware proxy, or hosted auth service.
- Until the identity provider is configured, protected operational systems
  should remain behind their existing access controls.
