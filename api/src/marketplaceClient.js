// Talks to Microsoft's SaaS Fulfillment API v2, which is how your backend
// resolves a purchase token into a subscription, activates it, and acknowledges
// webhook events. Docs: https://learn.microsoft.com/partner-center/marketplace-offers/pc-saas-fulfillment-api-v2
//
// This requires an Entra ID (Azure AD) app registration that you also entered
// into Partner Center's "Technical configuration" tab for this offer — see
// MARKETPLACE.md for the full setup walkthrough.

const FULFILLMENT_BASE = "https://marketplaceapi.microsoft.com/api/saas/subscriptions";
const API_VERSION = "2018-08-31";
// Fixed resource ID for the Marketplace Fulfillment API — not specific to your app.
const MARKETPLACE_RESOURCE_ID = "20e940b3-4c77-4b0b-9a53-9e16a1b010a7";

let cachedToken = null; // { token, expiresAt }

async function getAccessToken() {
  const tenantId = process.env.MARKETPLACE_AAD_TENANT_ID;
  const clientId = process.env.MARKETPLACE_AAD_CLIENT_ID;
  const clientSecret = process.env.MARKETPLACE_AAD_CLIENT_SECRET;

  if (!tenantId || !clientId || !clientSecret) {
    throw new Error(
      "MARKETPLACE_AAD_TENANT_ID / MARKETPLACE_AAD_CLIENT_ID / MARKETPLACE_AAD_CLIENT_SECRET application settings are not configured. See MARKETPLACE.md."
    );
  }

  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.token;
  }

  const res = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
      resource: MARKETPLACE_RESOURCE_ID,
    }),
  });

  if (!res.ok) {
    throw new Error(`Failed to get Marketplace API token: ${res.status} ${await res.text()}`);
  }

  const json = await res.json();
  cachedToken = { token: json.access_token, expiresAt: Date.now() + Number(json.expires_in || 3300) * 1000 };
  return cachedToken.token;
}

async function marketplaceFetch(path, options = {}) {
  const token = await getAccessToken();
  const url = `${FULFILLMENT_BASE}${path}${path.includes("?") ? "&" : "?"}api-version=${API_VERSION}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "x-ms-requestid": crypto.randomUUID(),
      "x-ms-correlationid": crypto.randomUUID(),
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    throw new Error(`Marketplace API ${options.method || "GET"} ${path} failed: ${res.status} ${await res.text()}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

// Exchange the one-time purchase token (from the ?token= query param on the
// landing page redirect) for the subscription details.
async function resolveSubscriptionToken(purchaseToken) {
  return marketplaceFetch("/resolve", {
    method: "POST",
    headers: { "x-ms-marketplace-token": purchaseToken },
  });
}

// Confirms the subscription is ready to use, on the plan the customer picked.
async function activateSubscription(subscriptionId, planId, quantity) {
  return marketplaceFetch(`/${subscriptionId}/activate`, {
    method: "POST",
    body: JSON.stringify({ planId, quantity: quantity || undefined }),
  });
}

async function getSubscription(subscriptionId) {
  return marketplaceFetch(`/${subscriptionId}`);
}

// Acknowledges a webhook operation so Microsoft knows you've handled it.
async function updateOperationStatus(subscriptionId, operationId, status) {
  return marketplaceFetch(`/${subscriptionId}/operations/${operationId}`, {
    method: "PATCH",
    body: JSON.stringify({ status }), // "Success" or "Failure"
  });
}

module.exports = {
  resolveSubscriptionToken,
  activateSubscription,
  getSubscription,
  updateOperationStatus,
};
