const { app } = require("@azure/functions");
const { getIdentity } = require("../identity");
const { resolveTenantId, readAssessment, writeAssessment } = require("../tenantStore");

app.http("data", {
  methods: ["GET", "POST"],
  authLevel: "anonymous",
  route: "data",
  handler: async (request, context) => {
    try {
      const identity = getIdentity(request);
      const tenantId = await resolveTenantId(identity);

      if (request.method === "GET") {
        const data = await readAssessment(tenantId);
        return { status: 200, jsonBody: data || {} };
      }

      if (request.method === "POST") {
        const body = await request.json();
        body.lastUpdatedAt = new Date().toISOString();
        body.lastUpdatedBy = identity?.userDetails || body.lastUpdatedBy || "";
        await writeAssessment(tenantId, body);
        return { status: 200, jsonBody: { ok: true, lastUpdatedAt: body.lastUpdatedAt } };
      }

      return { status: 405, jsonBody: { error: "Method not allowed" } };
    } catch (err) {
      context.error(err);
      return { status: 500, jsonBody: { error: err.message } };
    }
  },
});
