# RelayHorizon — Commercial operations plan

Status: **planning** for billing, pools, and CMS. **In product** (unreleased on
`development`, 4 September 2026): BYO request / approve, dual SES–SMTP DNS, and
platform-SMTP failover records on the SES set. Built 1.9.2 snapshot is in
[progress-summary.md](progress-summary.md). This note is the backlog for
**hosted commercial operation**: protect the master SES account, sell packages,
invoice automatically across the EU (and later anywhere), and publish legal and
marketing copy from the portal.

UI language remains EN / DE / HU.

## What is already true

- Tenants send through RelayHorizon (HTTPS and/or SMTP ingress). Egress is platform
  SES **or** tenant SMTP upstream (empty host → platform SMTP relay).
- BYO SES send is wired when an admin allows it and the tenant saves keys
  (`tenants.ses_config` + `metadata.ses_byo_allowed`). Domain identity, DKIM, and
  configuration-set create still run on **platform** SES. New tenants stay on
  platform SES until you sell and enable BYO. They can **Request bring-your-own
  SES** from Sending; portal Customers → Manage Approve / Deny (or the allow
  checkbox) and a registry filter for requested / approved.
- Domains store **both** SES and SMTP DNS sets. The live Sending route is checked;
  the other set is shown dimmed. Switching SES ↔ SMTP rebuilds the live set and
  forces a re-check. Empty SMTP host publishes the **platform** relay, not Amazon.
  RelayHorizon signs DKIM on SMTP; the uplink only forwards.
- When the platform SMTP relay is enabled, the **SES (base) set** also includes
  that host in SPF and the RelayHorizon DKIM TXT so you can fail over to the
  relay without a DNS change. Bounce MX on `outbound.{domain}` stays Amazon.
- Safety today: tenant `active`, verified DNS, API key `send`, calendar-month quota
  (default **100000**). The SES webhook marks bounce/complaint on logs; it does not
  suppress or trip the tenant.
- Portal **Customers → Manage** is rename + delete. Tenant nav has no Abuse or Billing.
- `/pricing` is a Resend vs self-host **calculator** plus waitlist. Stripe Payment
  Links exist for Launch Kit / Deployment Review. `collectStripeMetrics` runs if
  `STRIPE_SECRET_KEY` is set. There are no T&C pages, no CMS, no tenant invoices.

## Design rules

1. **Sending pool** = whose SES/IP and which caps. **Billing mode**
   (`invoiced` | `exempt`) is a separate flag. **People roles** stay
   `owner` / `admin` / `member`.
2. Invoice-exempt (in-house) tenants keep every guard and every log. No Stripe
   charge, no invoice document.
3. CMS holds **prose** (pricing page, T&C, news). **Prices, caps, and pool
   eligibility** are data the send path and Stripe use. An editor must not be able
   to publish “50k included” while the API still enforces 500.
4. Tenant Abuse is **transparency**. Tenant Billing is **money**. Portal Manage /
   Abuse is **power** (promote, freeze, assign pool).
5. One `invoices` table for every billed tenant, any country. Stripe and optional
   issuer adapters (for example Számlázz.hu) are columns, not two histories.
6. Automatic promotion on payment alone is forbidden. Volume unlocks
   **eligibility**; reputation + admin (or a documented auto-rule with a sample
   floor) **moves** the pool.
7. T&C must describe the same thresholds the product enforces. Signup stores
   `accepted_terms_version`.

## Sending pools

Starter catalog (names can change; fields matter):

| Pool | Egress | Typical caps | Who |
| --- | --- | --- | --- |
| **Probation** | Platform SES | Tight hour / day / month | Every new tenant |
| **Shared** | Platform SES | Medium | Proven clean, modest volume |
| **BYO** | Tenant SES or SMTP | High on our side | Sold, not self-serve — see below |
| **Dedicated** | Platform SES + dedicated IP / config set | High | High invoice volume, clean |

New tenants land in Probation. Egress becomes a **consequence of the pool**. The
tenant Sending tab must not let them put themselves on platform SES if the pool
is BYO, or the reverse.

Optional later: an **Internal** pool (tight bursts, platform SES) for in-house
apps that are also `billing_mode = exempt`.

## BYO SES sales path

BYO is **not** a self-serve toggle. The Sending card stays faded until an admin
allows it. They ask; you decide; you enable; you charge for the **relay**, not
for AWS.

**What they pay.** AWS bills their account for sending. The RelayHorizon charge
is a **monthly relay administrative fee** (optional one-time setup if you walk
IAM and the first domain): API and SMTP ingress, logs, webhooks,
bounce/complaint handling, dashboard, keys, domains, and keeping them on the
BYO pool. Price lives on a `billing_plans` row whose pool is BYO — not only in
CMS copy.

**Motion**

1. They stay on Probation / Shared (platform SES) until you agree.
2. They contact you via **Sending → Request bring-your-own SES** (stores
   `metadata.ses_byo_requested_at` and mails the alert address). No in-app
   checkout flips the pool. That request is the precursor to a billed
   **invoice group** in phase B (`byo-ses-relay`).
3. You quote the monthly fee and state that SES usage is theirs.
4. You tick **Allow bring-your-own SES** on Customers → Manage and assign the
   BYO plan / pool. Capability and money stay separate: the checkbox is not
   the invoice.
5. They receive a checklist: AWS account; IAM user with SES (and SNS when we
   provision events); paste keys and region; add the domain in RelayHorizon
   (today they still create the SES identity in their account; later the same
   wizard can call their key); leave SES sandbox if they are still in it;
   switch Sending to Bring your own only after that.
6. Until Stripe subscriptions exist, invoice the fee by hand or attach a
   Stripe Price manually.

**Do not** auto-enable BYO because they paid. **Do not** cut them over while
the account is still sandboxed unless you accept send-to-verified-identities
only. Prefer: stay on platform SES until `ProductionAccessEnabled`, then flip
`ses_config.mode` to `byo`.

If you later require BYO (reputation or volume on master SES), the same
checklist and fee apply; T&C already allow “we may require BYO.”

## Platform SMTP failover (DNS)

The platform SMTP relay is the **shared dumb uplink**: it forwards what
RelayHorizon already signed. For hosted SES tenants, publish the relay on the
SES record set (SPF `a:` / `include:` plus RelayHorizon DKIM) as soon as
Configuration has a real relay host. Then an SES outage or a manual flip to
SMTP (empty tenant host) does not wait on customer DNS.

Do **not** put a second bounce MX on `outbound.{domain}` — that would steal SES
MAIL FROM. Tenant-owned SMTP stays on the SMTP tab only; it is not mixed into
everyone’s SES SPF.

T&C should say: we may send via the platform SMTP relay if SES is unavailable,
provided the listed failover records are published. That is operational
continuity, not a second billed pool. The **BYO** pool remains the sold
tenant-SES (or tenant-SMTP) path.

## Abuse controls

**Send path** (`dispatchTenantEmail`): hourly, daily, and monthly caps from the
pool; refuse suppressed recipients; tenant must stay `active`.

**Webhook** (existing `/api/webhooks/ses`): on bounce/complaint, update rates;
suppress hard-bounce and complaint addresses; if bounce or complaint rate crosses
the pool tripwire over a minimum sample, freeze SES egress or `suspend` and notify.

**SES-side** (master account): per-tenant configuration set where possible;
CloudWatch alarms; do not put untrusted tenants on a shared dedicated IP.

**Portal → Abuse:** define pools; queue of tenants near a tripwire; promote /
demote / suspend.

**Customers → Manage:** assign pool, optional quota override, 24h rates,
suppressions, **billing mode** (invoiced / exempt + reason).

**Tenant console → Abuse:** same numbers, warnings, “what happens next.” They
cannot raise the pool or disable the breaker. In-app banner until acknowledged.
Mail (existing locale-aware system mail): approaching cap, rising bounce, freeze,
suspend.

## Billing and invoices

Invoicing is **EU-wide** (and later anywhere), not Hungary-only.

- **Stripe** is the default money and invoice rail for every invoiced tenant:
  customer, payment method, subscription or usage, automatic card charge, invoice
  PDF, dunning. **Stripe Tax** (or equivalent) handles EU VAT — local rate for
  B2C, reverse charge for B2B with a valid VAT number, OSS if you sell across the
  EU from one establishment.
- Tenant Billing collects legal name, address, and VAT/tax ID for any country.
- `billing_plans` map to sending-pool eligibility and to Stripe Products/Prices.
  The BYO plan is the monthly relay administrative fee (see sales path above),
  not a pass-through of AWS SES charges.
- Nightly (or Stripe usage records): count billable sends for `invoiced` tenants
  → Stripe subscription/usage → card charge → store the row tenants see.
- Failed payment: Stripe dunning, then **freeze sending** after N days (T&C).
- Exempt: skip Stripe and every invoice adapter; still meter; Health may show
  “SES cost of exempt tenants.”
- **Számlázz.hu** is an optional **issuer-side** adapter when the *company*
  needs a Hungarian NAV invoice for that sale — not a “Hungarian customers only”
  product path. If used, it runs after `invoice.paid` and stores ids on the same
  `invoices` row. If Stripe is merchant of record and that satisfies the
  accountant, Számlázz.hu can wait or be skipped.
- **Tenant → Billing** (owner, maybe admin): plan (only eligible plans), invoice
  details, card via Stripe Customer Portal (no raw card form), invoice list,
  **resend** the stored PDF (do not mint a new legal invoice number). Exempt sees
  “not invoiced.”
- **Portal → Billing:** failed invoices, adapter errors, exempt list, MRR.

Do not build a third invoicing engine, and do not add a per-country invoicer for
every EU state.

## CMS and legal

Portal **CMS** submenu:

- **Pricing** — public `/pricing`: commercial packages (plus optional calculator
  subsection).
- **Legal** — `/legal/terms`, `/privacy`, `/imprint`; versioned; EN/DE/HU;
  `effective_at`.
- **News** — `/news` or `/blog` (last).

Footer on the landing page reads **published** documents. Checkout/signup
requires current T&C.

T&C must cover: caps; freeze/suspend; no guarantee of platform SES; we may
send via the platform SMTP relay if SES is unavailable when failover DNS is
published; we may require BYO; BYO is sold (contact, monthly relay fee, their
AWS bill); log retention; abuse may close the account; card dunning then
freeze; exempt in-house still logged and capped; invoices issued for EU
customers (VAT/reverse charge as applicable).

## Phased delivery (implementation order)

Do not start C until A is live and T&C match the product.

**A — Policy the T&C can tell the truth about**  
**A0 shipped:** git-backed Terms / Privacy / Imprint at `/legal` (EN/DE/HU,
version + `effective_at`), landing footer, self-signup stores
`accepted_terms_version`. Not a portal CMS (that is E).  
Still in A: pools (or a `sending_tier` enum), hour/day/month caps, webhook
breaker + suppression, portal Manage assignment, tenant Abuse tab + warnings.

**B — Plans that match pools**  
`billing_plans` + `billing_mode` (including exempt). Split `/pricing` into real
packages. Tenant Billing: details + current plan (checkout may still be manual).

**C — Automatic cards and EU invoices**  
Stripe Customer + subscription/usage + Stripe Tax. Failed-payment freeze.
Invoice list + resend for every invoiced tenant.

**D — Issuer adapters**  
Számlázz.hu (or others) only if the issuing company needs them. VAT fields are
already on Billing from B/C.

**E — CMS + news**  
Move legal/pricing copy into portal CMS. Blog last.

## Out of scope for this plan

- Incoming mail / mailboxes.
- Letting tenants disable abuse checks.
- Auto-promote onto master SES because they paid.
- Dedicated-IP automation on day one (model the pool; implement later).
- A separate invoicing product per EU member state.

## Related docs

- [progress-summary.md](progress-summary.md) — what is built
- [admin-guide.md](admin-guide.md) / [sending.md](sending.md) — current manuals
- [security.md](security.md)
