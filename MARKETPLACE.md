# Publishing to the Microsoft Commercial Marketplace

This covers the marketplace-specific pieces on top of the base Azure deployment in `README.md`.
Do the base deployment first — this assumes the app is already live on Azure Static Web Apps.

The code side (multi-tenant data isolation, Microsoft sign-in, the landing page, and the
Fulfillment API webhook) is already built into this project. What's left is account setup and
configuration that only you can do, since it ties to your company's identity and your Partner
Center account.

## Offering it for free

Everything below applies whether you charge for the offer or not — the technical integration
(sign-in, landing page, webhook) is identical either way, because Microsoft still needs to track
who's subscribed even when no money changes hands. What's different for a free offer:

- **In Partner Center's offer setup**, when asked whether to sell through Microsoft, choose
  **"List through Microsoft Marketplace and process transactions independently,"** then set the
  plan's listing type to **"Get it now (Free)"** rather than "Sell through Microsoft."
- **You can skip payout and tax details** in account onboarding — those are only required for
  offers that collect payment. Business verification and identity verification are still required
  (Microsoft checks who's publishing regardless of price), but it's a lighter process than setting
  up a paid, transactable offer.
- Everything in section 4 below (landing page URL, webhook, Entra tenant/app ID) still applies —
  free offers still go through the Fulfillment API so Microsoft can provision and track
  subscriptions, they just never bill anyone.
- Skip the Metering API note in "What's simplified here" entirely — it's only relevant to paid,
  usage-based plans.

## What "multi-tenant" means here

Each company that subscribes through the marketplace gets its own isolated assessment data,
keyed by their Microsoft Marketplace subscription ID. A customer's data is only ever reachable by
someone signed in with a Microsoft work account from that same company's Entra ID (Azure AD)
tenant. Your own team's existing assessment (if you've been using the app internally) is
untouched — it keeps living under a `default` key and stays reachable without signing in, so
nothing breaks for your internal use.

## 1. Register an Entra ID (Azure AD) app

You need one Entra ID app registration for two things: letting customers sign in, and letting your
backend call Microsoft's Fulfillment API. Using the same app for both is the standard, simplest
approach.

1. In the [Azure Portal](https://portal.azure.com) → **Microsoft Entra ID → App registrations →
   New registration**.
2. Name it something like `Aijentix AI Maturity Assessment`.
3. Under **Supported account types**, choose **Accounts in any organizational directory
   (Any Microsoft Entra ID tenant - Multitenant)** — this is required so customers can sign in
   with *their own* company's Microsoft account, not just yours.
4. Under **Redirect URI**, add a Web redirect URI:
   `https://<your-app-name>.azurestaticapps.net/.auth/login/aad/callback`
5. After creation, note the **Application (client) ID** and **Directory (tenant) ID** shown on the
   Overview page.
6. Go to **Certificates & secrets → New client secret**. Copy the secret value immediately — it's
   only shown once.

## 2. Add the app's credentials to your Static Web App

```bash
az staticwebapp appsettings set \
  --name $SWA \
  --resource-group $RG \
  --setting-names \
    AAD_CLIENT_ID="<Application (client) ID from step 1>" \
    AAD_CLIENT_SECRET="<the client secret value>" \
    MARKETPLACE_AAD_TENANT_ID="<Directory (tenant) ID from step 1>" \
    MARKETPLACE_AAD_CLIENT_ID="<same Application (client) ID>" \
    MARKETPLACE_AAD_CLIENT_SECRET="<same client secret value>"
```

(`AAD_CLIENT_ID`/`AAD_CLIENT_SECRET` are what Static Web Apps' built-in login uses;
`MARKETPLACE_AAD_*` are what the backend uses to call Microsoft's Fulfillment API. They point at
the same app registration, just used in two different places in the code.)

## 3. Set up your Partner Center account

1. Go to [Partner Center](https://partner.microsoft.com/dashboard) and enroll in the Commercial
   Marketplace program if you haven't already.
2. Complete **Account settings**: legal business profile, tax information, and a payout (bank)
   account — Microsoft won't let an offer go live without these.
3. Accept the **Microsoft Publisher Agreement**.

This step involves identity/business verification and can take several business days — worth
starting early and in parallel with everything else.

## 4. Create the SaaS offer in Partner Center

1. **New offer → Software as a Service**. Give it an offer ID and name.
2. **Properties**: category (e.g. "IT & Management Tools"), legal terms, privacy policy URL.
3. **Offer listing**: description, screenshots, support contact.
4. **Plan overview**: create at least one plan (e.g. "Team" — flat monthly price, or per-seat).
   You can add a free trial here too.
5. **Technical configuration** — this is the important one:
   - **Landing page URL**: `https://<your-app-name>.azurestaticapps.net/marketplace/landing`
   - **Connection webhook**: `https://<your-app-name>.azurestaticapps.net/api/marketplace/webhook`
   - **Microsoft Entra tenant ID**: the Directory (tenant) ID from step 1.
   - **Microsoft Entra app ID**: the Application (client) ID from step 1.
6. Save as draft.

## 5. Test it before going live

Partner Center gives you a **"Preview" / test-drive link** for the offer while it's still in draft.
Use that link (not the real marketplace) to simulate a purchase end-to-end:

1. Click the preview link, sign in with a test Microsoft account, pick a plan.
2. You should land on `/marketplace/landing`, get prompted to sign in (if not already), then see
   "Activating your subscription…" followed by a redirect into the app.
3. Check Azure Storage (or add a temporary log) to confirm a `tenants/<subscriptionId>.json` and a
   `tenant-map/<aadTenantId>.json` blob were created.
4. In Partner Center, use the "Change plan" and "Cancel" test actions and confirm your webhook
   receives them (check the Function's logs in the Azure Portal → your Static Web App → Functions
   → Monitor).

## 6. Submit for certification

Once the test flow works, submit the offer from Partner Center. Microsoft reviews the listing
content and tests the technical flow (landing page, webhook, and that it handles edge cases like
an already-active subscription). Budget a few weeks and expect at least one round of feedback —
this is normal, not a sign something's broken.

## Notes on what's simplified here

- **One plan tier assumed.** If you offer several plans with different feature limits, you'll want
  to store `planId` on the tenant record (already saved) and gate features off it in the frontend.
- **No usage-based billing.** If you want metered pricing instead of flat/per-seat, you'll need to
  call the Metering API when usage happens — not included here, but the `marketplaceClient.js`
  file is the natural place to add it (`POST /api/usageEvent`).
- **No admin/member roles within a customer.** Right now anyone signed in from a mapped AAD tenant
  can edit that tenant's assessment. Add role checks if you need to restrict editing to specific
  people within a customer's company.
