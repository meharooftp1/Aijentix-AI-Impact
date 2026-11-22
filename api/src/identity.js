// Azure Static Web Apps injects a base64-encoded JSON "client principal" header
// on every request once a user is signed in via /.auth/login/aad. This decodes
// it and pulls out the pieces we care about: the caller's own Entra ID tenant
// (their company), which is how we map a signed-in user to their marketplace
// subscription.

function getClientPrincipal(request) {
  const header = request.headers.get("x-ms-client-principal");
  if (!header) return null;
  try {
    const decoded = Buffer.from(header, "base64").toString("utf-8");
    const principal = JSON.parse(decoded);
    if (!principal || !principal.identityProvider) return null;
    return principal;
  } catch {
    return null;
  }
}

// AAD claims come through as a flat array of {typ, val} pairs.
function getClaim(principal, claimType) {
  if (!principal?.claims) return null;
  const claim = principal.claims.find((c) => c.typ === claimType);
  return claim ? claim.val : null;
}

function getIdentity(request) {
  const principal = getClientPrincipal(request);
  if (!principal) return null;
  return {
    userId: principal.userId,
    userDetails: principal.userDetails, // usually the email/UPN
    aadTenantId: getClaim(principal, "http://schemas.microsoft.com/identity/claims/tenantid") || getClaim(principal, "tid"),
    name: getClaim(principal, "name"),
  };
}

module.exports = { getIdentity };
