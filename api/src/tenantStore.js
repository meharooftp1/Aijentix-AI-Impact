const { readJson, writeJson } = require("./jsonStore");

// A "tenant" here means one subscribing customer company, identified by their
// Microsoft Marketplace SaaS subscriptionId. Each tenant gets its own
// assessment data, fully isolated from every other tenant.

const DEFAULT_TENANT_ID = "default"; // used when marketplace mode isn't active (internal single-team use)

function tenantRecordPath(subscriptionId) {
  return `tenants/${subscriptionId}.json`;
}

function tenantMapPath(aadTenantId) {
  return `tenant-map/${aadTenantId}.json`;
}

function assessmentPath(tenantId) {
  return `assessments/${tenantId}.json`;
}

async function saveTenant(record) {
  await writeJson(tenantRecordPath(record.subscriptionId), record);
}

async function getTenant(subscriptionId) {
  return readJson(tenantRecordPath(subscriptionId));
}

async function mapAadTenantToSubscription(aadTenantId, subscriptionId) {
  await writeJson(tenantMapPath(aadTenantId), { aadTenantId, subscriptionId });
}

async function getSubscriptionForAadTenant(aadTenantId) {
  const mapping = await readJson(tenantMapPath(aadTenantId));
  return mapping ? mapping.subscriptionId : null;
}

// Resolves which tenant's data a request should read/write:
// 1. If the caller is signed in and their AAD tenant is mapped to a marketplace
//    subscription, use that subscription's data.
// 2. Otherwise fall back to the single shared "default" tenant, so the app keeps
//    working exactly as before for internal, non-marketplace use.
async function resolveTenantId(identity) {
  if (identity?.aadTenantId) {
    const subscriptionId = await getSubscriptionForAadTenant(identity.aadTenantId);
    if (subscriptionId) return subscriptionId;
  }
  return DEFAULT_TENANT_ID;
}

async function readAssessment(tenantId) {
  return readJson(assessmentPath(tenantId));
}

async function writeAssessment(tenantId, data) {
  await writeJson(assessmentPath(tenantId), data);
}

module.exports = {
  DEFAULT_TENANT_ID,
  saveTenant,
  getTenant,
  mapAadTenantToSubscription,
  getSubscriptionForAadTenant,
  resolveTenantId,
  readAssessment,
  writeAssessment,
};
