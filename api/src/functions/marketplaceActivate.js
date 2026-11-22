const { app } = require("@azure/functions");
const { getIdentity } = require("../identity");
const { resolveSubscriptionToken, activateSubscription } = require("../marketplaceClient");
const { saveTenant, mapAadTenantToSubscription } = require("../tenantStore");

// Called by the frontend's /marketplace/landing page. The route itself is
// locked to signed-in users via staticwebapp.config.json ("authenticated"),
// so by the time this runs we know who the caller is and which AAD tenant
// (company) they belong to.
app.http("marketplaceActivate", {
  methods: ["POST"],
  authLevel: "anonymous", // access control is enforced by the SWA route rule, not this function
  route: "marketplace/activate",
  handler: async (request, context) => {
    try {
      const identity = getIdentity(request);
      if (!identity?.aadTenantId) {
        return { status: 401, jsonBody: { error: "Sign-in required to activate a subscription." } };
      }

      const body = await request.json();
      const purchaseToken = body?.token;
      if (!purchaseToken) {
        return { status: 400, jsonBody: { error: "Missing purchase token." } };
      }

      const resolved = await resolveSubscriptionToken(purchaseToken);
      const subscriptionId = resolved.id;
      const planId = resolved.planId;

      // Idempotent: activating an already-active subscription is a no-op on Microsoft's side.
      await activateSubscription(subscriptionId, planId);

      await saveTenant({
        subscriptionId,
        aadTenantId: identity.aadTenantId,
        offerId: resolved.offerId,
        planId,
        publisherId: resolved.publisherId,
        customerName: resolved.beneficiary?.email || identity.userDetails,
        state: "Subscribed",
        activatedAt: new Date().toISOString(),
      });
      await mapAadTenantToSubscription(identity.aadTenantId, subscriptionId);

      return { status: 200, jsonBody: { ok: true, subscriptionId, planId } };
    } catch (err) {
      context.error(err);
      return { status: 500, jsonBody: { error: err.message } };
    }
  },
});
