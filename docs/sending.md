# Sending

The tenant **Guide** tab is the in-console version of this walkthrough.

The sending console and portal share **EN, DE, and HU** in the header. Forgot-password mail uses the language last selected on the site.

## How apps submit (ingress)

Each tenant chooses one of:

- `https` — Resend-compatible `POST /api/emails`
- `smtp` — SMTP submission (`npm run smtp`, default port **2525**)
- `both`

```http
POST /api/emails
Authorization: Bearer frs_<id>_<secret>
Content-Type: application/json

{
  "from": "hello@your-domain.example",
  "to": ["user@example.com"],
  "subject": "Hello",
  "html": "<p>Hi</p>"
}
```

SMTP submission uses username `relayhorizon` and the API key as the password. Closed channels return an error (HTTPS `403`, SMTP `535`/`550`).

`from` must match a **verified** domain on the same tenant as the API key.

## Domain DNS (required before sending)

Adding a domain lists **MX, SPF, DKIM, and DMARC**. Bounce MX is published on `outbound.{domain}` so the domain’s existing inbound MX is left alone.

SPF depends on egress:

- **SES** — `include:amazonses.com` on the sending domain and on `outbound.{domain}`. The MX *target* `inbound-smtp.{region}.amazonaws.com` is Amazon’s bounce host; that name is theirs.
- **SMTP** — authorize the upstream host (or `mx:outbound.{domain}`). Do **not** include Amazon SES.

Check records in the dashboard. Sending stays blocked until every required record matches, unless `SKIP_DNS_VERIFICATION=true` (local only).

## How mail leaves (egress)

Each tenant has a switch:

- `ses` — Amazon SES over HTTPS (platform AWS keys)
- `smtp` — Nodemailer to `smtp_upstream` (host, port, TLS, credentials), DKIM-signed with the domain key RelayHorizon publishes

Set both switches in the dashboard **Sending** tab or `PATCH /api/tenant`.

Local: `docker compose --profile dev up` and point SMTP host at `mailhog` port `1026`.
