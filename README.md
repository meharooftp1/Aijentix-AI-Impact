# Aijentix AI Value & Impact

React + Vite assessment portal backed by an ASP.NET Core 8 API and PostgreSQL.

## Main features
- JWT login/logout using ASP.NET Core Identity credentials.
- Platform administrator company selection and company administration.
- Company create/edit/deactivate operations.
- User creation, company membership and company-role management.
- Multiple assessments per company.
- Immutable assessment version history, historical viewing and restore-as-new-version.
- Existing scoring, dashboard calculations and PDF report components load from the selected company and assessment.

## Run locally

1. Configure PostgreSQL and ASP.NET Core User Secrets as described in [`server/README.md`](server/README.md).
2. Start the API at `https://localhost:7001`:

```powershell
cd server/Aijentix.Api
dotnet run --urls https://localhost:7001
```

3. In a second terminal, from the repository root:

```bash
npm install
npm run dev
```

The Vite development proxy sends `/api/*` requests to the ASP.NET Core API. Set `VITE_API_PROXY_TARGET` if your API uses a different port. You can also set `VITE_API_BASE_URL` for a separately hosted API.

## Roles
- `PlatformAdmin`: manages all client companies and creates users with an initial company membership.
- `CompanyAdmin`: manages users/memberships in their company and can create/update assessments.
- `Assessor`: can create and update assessments in their company.
- `Viewer`: read-only access to company assessments.

Company roles are stored in `CompanyMemberships`; only `PlatformAdmin` is a global ASP.NET Core Identity role. The API enforces membership on every company-scoped operation.

See [`server/README.md`](server/README.md) for endpoints, database setup and production hardening notes.
