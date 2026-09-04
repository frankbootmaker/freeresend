# Sending

The tenant **Guide** tab is the in-console version of this walkthrough.

The sending console and portal share **EN, DE, and HU** in the header. Forgot-password mail uses the language last selected on the site.

## How apps submit (ingress)

Each tenant chooses one of:

- `https` — Resend SDK `RESEND_BASE_URL=https://<host>/api` (SDK POSTs `/emails`). Raw clients `POST /api/emails`
- `smtp` — SMTP submission (public port **587**; local `npm run smtp` still defaults to **2525**)
- `both`

The tenant **Sending** tab only shows HTTPS or SMTP fields for the ingress you pick. TLS for the upstream relay is on SMTP egress, not on the HTTPS card.

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

Public mail clients use the host shown on **Sending** and port **587** (STARTTLS when the platform has a certificate). Port **2525** is a local/debug listener: on Compose it is published as `127.0.0.1:2525` only, so it is not reachable from the internet. Port **465** is implicit TLS and only answers when the platform has enabled that listen port and a certificate. If a client connects then refuses the session, inbound SMTP TLS still needs to be set under portal **Configuration**.

`from` must match a **verified** domain on the same tenant as the API key.

Sends that are not `failed` count against hour / day / month caps. New tenants start in the **probation** pool (**5,000** / **20,000** / **100,000**). Portal Customers → Manage can assign **shared**, **bring-your-own**, or **dedicated** and override those caps. Permanent SES bounces and complaints suppress that recipient; further sends to them return **422**. Transient bounces are not suppressed. SMTP-uplink failures do not write the suppression list.

API keys are listed with label, **domain**, prefix, scope, and last used. Any member of the tenant can delete a key (including the provisioned default). Copy a new secret once.

Delivery **Logs** (tenant and portal) page at 25 rows by default. Choose 5, 10, 25, or 50. Search applies on Apply, not every keystroke.

## Domain DNS (required before sending)

Adding a domain lists **MX, SPF, DKIM, and DMARC** for **both** SES and SMTP. The live Sending route is checked; the other set is shown dimmed. Switching SES ↔ SMTP rebuilds the live set and re-checks. Bounce MX is published on `outbound.{domain}` so the domain’s existing inbound MX is left alone.

SPF and DKIM depend on the set:

- **SES** — `include:amazonses.com` on the sending domain and on `outbound.{domain}`. The MX *target* `inbound-smtp.{region}.amazonaws.com` is Amazon’s bounce host; that name is theirs. If the **platform SMTP relay** is enabled, this set also adds that host to SPF and a RelayHorizon DKIM TXT so failover can send without a DNS change. Bounce MX stays Amazon.
- **SMTP** — authorize the tenant upstream, or the platform relay when the tenant left host empty (or `mx:outbound.{domain}` for localhost). RelayHorizon signs DKIM; the uplink only forwards. Do **not** include Amazon SES.

Check records in the dashboard. Sending stays blocked until every required record on the **live** set matches, unless `SKIP_DNS_VERIFICATION=true` (local only).

## How mail leaves (egress)

Each tenant has a switch:

- `ses` — Amazon SES over HTTPS. The Sending tab shows **Platform** (this installation’s account) or **Bring your own** (faded until a platform administrator enables it). Platform SES does not show API keys.
- `smtp` — Nodemailer to `smtp_upstream` (host, port, TLS, credentials), DKIM-signed with the domain key RelayHorizon publishes

Set both switches in the dashboard **Sending** tab or `PATCH /api/tenant`.

Local: `docker compose --profile dev up` and point SMTP host at `mailhog` port `1026`.

## Organization deletion (GDPR)

The organization owner can erase this tenant from the console **Organization** tab. It is a two-step confirmation: read the warnings, then type the organization name and acknowledge that the action cannot be undone.

That deletes domains, API keys, MCP tokens, delivery logs, and accounts that exist only in this tenant. People who still belong to another tenant, or who are platform administrators, are kept. The platform tenant cannot be deleted.

`DELETE /api/tenant` with `{ "confirmName": "<organization name>" }` requires a dashboard session (not an API key or MCP token).
