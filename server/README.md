# Aijentix API (ASP.NET Core 8 + PostgreSQL)

The React portal uses this API for authentication, company management, users/memberships, assessments and version history. The legacy Azure Functions Blob API remains in the repository for reference only; the current React editor no longer reads or writes `/api/data`.

## Security model
- ASP.NET Core Identity stores users and password hashes; JWT Bearer authenticates API requests.
- `PlatformAdmin` is a global Identity role. `CompanyAdmin`, `Assessor` and `Viewer` are company-membership roles in `CompanyMemberships`.
- Company membership and assessment access are checked server-side. Assessment queries include both company ID and assessment ID.
- Company deactivation is a soft deactivation (`IsActive=false`). It preserves assessments and history but blocks normal member access.
- Restoring a historical version creates a new version; it does not overwrite or delete the intervening history.

## Local setup
1. Install .NET 8 SDK and PostgreSQL 15+.
2. Create database `aijentix_ai_impact` and update the local PostgreSQL connection string in `appsettings.Development.json` or User Secrets.
3. From `server/Aijentix.Api`, initialize User Secrets and set secrets. The bootstrap password key accepts either `BootstrapAdmin:Password` or the earlier `AdminSeed:Password` name:

```powershell
dotnet user-secrets init
dotnet user-secrets set "Jwt:Key" "YOUR_RANDOM_SECRET_AT_LEAST_32_CHARACTERS_LONG"
dotnet user-secrets set "BootstrapAdmin:Password" "YOUR_STRONG_LOCAL_ADMIN_PASSWORD"
# If needed, also store the database connection string:
dotnet user-secrets set "ConnectionStrings:Postgres" "Host=localhost;Port=5432;Database=aijentix_ai_impact;Username=postgres;Password=YOUR_DB_PASSWORD"
```

4. Trust the ASP.NET Core development certificate:

```powershell
dotnet dev-certs https --trust
```

5. Run the API:

```powershell
dotnet run --urls https://localhost:7001
```

The first startup creates the schema using EF Core `EnsureCreated` and seeds the PlatformAdmin user if the configured email does not already exist. This scaffold still needs versioned EF Core migrations before production deployment; `EnsureCreated` is not a migration system.

`appsettings.Development.json` is git-ignored and contains local-only values (localhost database, dev JWT key). `appsettings.json` intentionally holds no secrets — production values come from environment variables, e.g. `ConnectionStrings__Postgres` and `Jwt__Key`.

## Deploying to Vercel

See [`Aijentix.Api/DEPLOY-VERCEL.md`](Aijentix.Api/DEPLOY-VERCEL.md). The API ships as a container via the root `Dockerfile` in `Aijentix.Api/`; the frontend stays a separate Vite project.


## Run the React application
From the repository root:

```bash
npm install
npm run dev
```

Vite proxies `/api` to `https://localhost:7001` by default. If your API listens on another URL, set `VITE_API_PROXY_TARGET` before starting Vite. Example PowerShell:

```powershell
$env:VITE_API_PROXY_TARGET="https://localhost:7243"
npm run dev
```

## API routes

### Authentication
- `POST /api/auth/login`

### Companies (PlatformAdmin)
- `GET /api/companies` — active companies
- `GET /api/companies?includeInactive=true` — all companies
- `POST /api/companies` — create
- `PUT /api/companies/{companyId}` — edit
- `DELETE /api/companies/{companyId}` — deactivate (soft)

### Users and memberships
- `POST /api/companies/{companyId}/users` — PlatformAdmin creates a user and initial company membership
- `GET /api/companies/{companyId}/members` — CompanyAdmin / PlatformAdmin
- `POST /api/companies/{companyId}/members` — add an existing user
- `PUT /api/companies/{companyId}/members/{userId}` — change company role
- `DELETE /api/companies/{companyId}/members/{userId}` — remove company membership

### Assessments
- `GET /api/companies/{companyId}/assessments`
- `POST /api/companies/{companyId}/assessments` — create multiple assessments per company
- `GET /api/companies/{companyId}/assessments/{id}`
- `PUT /api/companies/{companyId}/assessments/{id}` — saves a new immutable history version
- `GET /api/companies/{companyId}/assessments/{id}/history`
- `GET /api/companies/{companyId}/assessments/{id}/history/{version}` — view snapshot
- `POST /api/companies/{companyId}/assessments/{id}/history/{version}/restore` — restore as a new version

## Notes before production
- Replace `EnsureCreated` with EF Core migrations and deploy schema changes through a controlled migration process.
- Use separate production secrets in Key Vault or the hosting provider's secret store. Never deploy development settings or sample credentials.
- Configure production CORS origins and HTTPS endpoints.
- Add integration tests for cross-company access, role restrictions, deactivated companies, assessment versioning and restore behavior.
