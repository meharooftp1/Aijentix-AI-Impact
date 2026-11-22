const { app } = require("@azure/functions");
const { updateOperationStatus } = require("../marketplaceClient");
const { getTenant, saveTenant } = require("../tenantStore");

// Microsoft calls this endpoint directly (no user is signed in), so it must
// stay anonymous — but it's a good idea to also configure this exact URL in
// Partner Center's "Technical configuration" so nobody else knows to call it,
// and Microsoft's calls include a subscriptionId/operationId you always
// re-verify against the Fulfillment API before trusting (see below).
app.http("marketplaceWebhook", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "marketplace/webhook",
  handler: async (request, context) => {
    try {
      const event = await request.json();
      const { id: operationId, subscriptionId, action, planId } = event;

      const tenant = (await getTenant(subscriptionId)) || { subscriptionId };

      switch (action) {
        case "Unsubscribe":
          tenant.state = "Unsubscribed";
          break;
        case "Suspend":
          tenant.state = "Suspended";
          break;
        case "Reinstate":
          tenant.state = "Subscribed";
          break;
        case "ChangePlan":
          tenant.state = "Subscribed";
          tenant.planId = planId;
          break;
        case "ChangeQuantity":
          tenant.state = "Subscribed";
          break;
        case "Renew":
          tenant.state = "Subscribed";
          break;
        default:
          context.warn(`Unhandled marketplace action: ${action}`);
      }
      tenant.lastWebhookAction = action;
      tenant.lastWebhookAt = new Date().toISOString();
      await saveTenant(tenant);

      // Tell Microsoft we've handled it, or they'll keep retrying.
      await updateOperationStatus(subscriptionId, operationId, "Success");

      return { status: 200, jsonBody: { ok: true } };
    } catch (err) {
      context.error(err);
      // Returning 500 lets Microsoft retry the webhook later.
      return { status: 500, jsonBody: { error: err.message } };
    }
  },
});
