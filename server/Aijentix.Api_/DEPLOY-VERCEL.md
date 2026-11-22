# Deploying Aijentix.Api to Vercel

Vercel has no native .NET runtime, so this API ships as a **container** using Vercel's
Container runtime (beta, available on all plans). Vercel builds the root `Dockerfile`,
pushes the image to Vercel Container Registry, runs it as a Function and routes **all**
paths to it — so `/api/auth/login` works directly on the project domain.

Everything needed is in this folder:

| File | Purpose |
| --- | --- |
| `Dockerfile` | Multi-stage .NET 8 build → `aspnet:8.0` runtime, non-root, port 8080 |
| `.dockerignore` | Keeps `bin/`, `obj/`, `.vs/`, zips and local secrets out of the image |
| `.vercelignore` | Keeps the same files out of the upload |
| `.gitignore` | Keeps build output and real secrets out of Git |
| `vercel.json` | Pins the function region to `bom1` (Mumbai); change or delete as needed |
| `appsettings.json` | Sanitised — **no secrets**. Production values come from env vars |
| `appsettings.Development.json` | Local-only dev values (git-ignored, excluded from Docker) |

---

## 0. Rotate the secrets that were in the old zip

The previous `appsettings.json` / `appsettings.json-localDBWorking` contained a live
Postgres user + password, the JWT signing key and the bootstrap admin password. If that
zip was shared or committed, rotate all three before deploying:

* Postgres password (Prisma/Neon dashboard)
* `Jwt:Key` — generate a new one (below); all existing tokens become invalid
* Bootstrap admin password

Also delete/ignore the leftover `appsettings.json-`, `appsettings.Development.json-` and
`appsettings.json-localDBWorking` files — they are not part of the deployment.

---

## 1. Prerequisites

* A Vercel account and the CLI: `npm i -g vercel`
* Node 18+ (for the CLI)
* Your Postgres connection string, reachable from the internet
  (Prisma Postgres / Neon / Supabase / RDS all work)

---

## 2. Deploy the API project

### Option A — Vercel CLI (fastest)

```bash
cd server/Aijentix.Api
vercel link          # create a new project, e.g. aijentix-api
vercel --prod
```

Because the folder has no `package.json`/framework, Vercel selects the **Container**
preset automatically and builds `Dockerfile`. If Vercel ever picks another framework:

```bash
vercel project update --framework container --yes
```

### Option B — Git integration

1. Push the repo to GitHub/GitLab/Bitbucket.
2. **Add New → Project**, import the repo.
3. Set **Root Directory** to `server/Aijentix.Api`.
4. Framework Preset: **Container** (auto-detected).
5. Add the environment variables from step 3, then **Deploy**.

> Do **not** deploy the repository root for the API — the root is the Vite frontend.
> The frontend is a separate Vercel project (step 5).

---

## 3. Environment variables

Set these in **Project → Settings → Environment Variables** for **Production** and
**Preview** (double underscores map to `:` in .NET configuration):

| Variable | Required | Example / notes |
| --- | --- | --- |
| `PORT` | yes | `8080` — must match the port in `Dockerfile` |
| `ConnectionStrings__Postgres` | yes | `Host=...;Port=5432;Database=aijentix_ai_impact;Username=...;Password=...;SSL Mode=Require;Maximum Pool Size=5` |
| `Jwt__Key` | yes | 32+ random chars (base64 recommended) |
| `Jwt__Issuer` | yes | `Aijentix.AIImpact` |
| `Jwt__Audience` | yes | `Aijentix.AIImpact.Client` |
| `Cors__Origins__0` | yes | `https://your-frontend.vercel.app` |
| `Cors__Origins__1` | optional | extra origin (preview URL, custom domain) |
| `Bootstrap__Enabled` | first run | `true` for the first deploy, then set `false` |
| `BootstrapAdmin__Email` | first run | `admin@yourdomain.com` |
| `BootstrapAdmin__Password` | first run | strong password, delete after seeding |
| `ASPNETCORE_ENVIRONMENT` | optional | `Production` (already the Docker default) |
| `DOTNET_EnableDiagnostics` | optional | `0` (already the Docker default) |

`Cors__Origins__0`, `__1`, … replace the array in `appsettings.json` element by element.
Wildcard entries are supported because the policy enables wildcard subdomains, e.g.
`Cors__Origins__1=https://*.vercel.app` for preview deployments.

Generate a JWT key:

```powershell
$b = New-Object byte[] 48
[Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b)
[Convert]::ToBase64String($b)
```

```bash
openssl rand -base64 48
```

---

## 4. First run (schema + admin)

`Bootstrap:Enabled` defaults to `true`, so the first successful start:

1. runs `EnsureCreated()` — creates the whole schema if the database is empty;
2. creates the roles `PlatformAdmin`, `CompanyAdmin`, `Assessor`, `Viewer`;
3. creates the bootstrap admin from `BootstrapAdmin__Email` / `__Password`.

Once you have logged in successfully:

1. set `Bootstrap__Enabled=false`;
2. delete `BootstrapAdmin__Password` (and optionally `BootstrapAdmin__Email`);
3. redeploy so the new values take effect.

That removes schema/seed work from every cold start.

> **`EnsureCreated` is not a migration system.** It only creates a schema in an empty
> database and never alters an existing one. Before you rely on this in production,
> add EF Core migrations and apply them once (`dotnet ef database update`) instead of
> letting the app create the schema.

---

## 5. Deploy the frontend and point it at the API

The frontend is deployed as a **separate** Vercel project:

1. Import the repo again; keep **Root Directory** at the repo root.
2. Framework preset **Vite**; build `npm run build`; output `dist`.
3. Add a root `.vercelignore` (already included) so the `server/` and `api/` folders are
   not uploaded with the frontend.
4. Set `VITE_API_BASE_URL=https://aijentix-api.vercel.app` (no trailing slash).
   It is baked in **at build time** — redeploy after changing it.
5. Make sure the frontend origin is listed in `Cors__Origins__*` on the API project.

For a custom domain, add it to both projects and update `VITE_API_BASE_URL` and
`Cors__Origins__0` to the final URLs.

---

## 6. Smoke test

```bash
curl -i https://aijentix-api.vercel.app/health
curl -i https://aijentix-api.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@yourdomain.com","password":"YOUR_PASSWORD"}'
```

Then log in through the deployed frontend and confirm the browser devtools show no CORS
errors. If login returns `Invalid email or password` right after the first deploy, check
the function logs — the seeding step may have failed (bad connection string, weak
password that violates Identity's policy, or admin already exists with another password).

The first request after ~5 minutes of idle traffic pays a cold start (roughly 1–3 s for
.NET + EF Core + Identity).

---

## 7. Test the image locally (optional)

```bash
cd server/Aijentix.Api
docker build -t aijentix-api .

docker run --rm -p 8080:8080 \
  -e ConnectionStrings__Postgres="Host=host.docker.internal;Port=5432;Database=aijentix_ai_impact;Username=postgres;Password=..." \
  -e Jwt__Key="local-test-key-at-least-32-characters-long" \
  -e Jwt__Issuer="Aijentix.AIImpact" \
  -e Jwt__Audience="Aijentix.AIImpact.Client" \
  -e Cors__Origins__0="http://localhost:5173" \
  aijentix-api
```

Then open <http://localhost:8080/health>.

---

## 8. Behaviour and limits to know about

| Topic | Detail |
| --- | --- |
| HTTPS | Terminated at Vercel's edge; the container only receives HTTP. `UseHttpsRedirection` is now Development-only. |
| Scale to zero | 5 minutes idle in production, 30 seconds in preview; `SIGTERM` with a 30 s grace period. |
| Request body | 4.5 MB cap — fine for this API, but keep assessment payloads small. |
| Duration | 300 s max on Hobby; 800 s+ on Pro/Enterprise. |
| Memory | 2 GB (Hobby) / 4 GB (Pro). |
| Regions | `vercel.json` pins `bom1` (Mumbai). Keep it close to the database. |
| Beta | The Container runtime is in beta. Keep a `Dockerfile`-compatible fallback host (Azure App Service, Container Apps, Render, Fly.io) in mind for critical workloads. |
| Cold-start DB load | Each instance opens its own pool. Use the provider's **pooled** connection string and cap `Maximum Pool Size`. |
| `api/` folder | Legacy Azure Functions code in the repo. It is ignored on both projects via `.vercelignore`. |

---

## 9. Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Build fails at `dotnet restore` | NuGet unreachable from the build, or SDK/image mismatch | Re-run the deployment; keep `mcr.microsoft.com/dotnet/sdk:8.0` |
| `502` / `FUNCTION_INVOCATION_FAILED` | App crashed at startup (usually config validation) | Check runtime logs; the API now throws a clear error for a missing connection string or a JWT key under 32 chars |
| `504` on first request | Cold start exceeding the limit, or DB unreachable | Check DB reachability/SSL; reduce startup work with `Bootstrap__Enabled=false` |
| CORS error in browser | Origin not in `Cors__Origins__*` | Add it, then redeploy |
| Login works with curl, fails in the browser | Origin mismatch / `VITE_API_BASE_URL` pointing to the wrong project | Rebuild the frontend after changing the env var |
| `password` rejected on seeding | Identity requires 12+ chars with upper/lower/digit/symbol | Use a compliant password |
| Schema missing after a deploy | `Bootstrap__Enabled=false` on a fresh database | Set it back to `true` for one deploy |

---

## Alternative hosts

If the beta status or cold starts are a problem, the same folder deploys unchanged to:

* **Azure App Service** (Linux, .NET 8) — native .NET, no container needed
* **Azure Container Apps / Render / Fly.io / Railway** — use the same `Dockerfile`
* **Vercel Services** — one project routing `/api/*` to this container and the rest to a
  containerised frontend; more moving parts, only worth it if you need a single domain
  without CORS.
