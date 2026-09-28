# Isolated local Instagram test environment

This is a preparation guide for a future, separately authorized Instagram OAuth test. It does not start services, contact Meta, create a tunnel, or apply migrations.

## Components and isolation

- Frontend: the guarded wrapper `npm run start:instagram-test:web` builds and starts Next.js in production mode on loopback port 3000. The legacy `dev:instagram-test:web` alias uses the same stable wrapper.
- API: the Compose API service runs the existing `npm start` command.
- Worker: the Compose worker service runs `npm run start:worker`.
- PostgreSQL and Redis: private Compose services with no published host ports.
- Scheduler: deliberately omitted from all commands below.
- AI: no `GEMINI_API_KEY` is included in the test template or Compose test overlay; `INSTAGRAM_POST_SYNC_AI_ENABLED=false` also disables the optional post-sync AI hook for every job reason.

The versioned `.env.instagram-test.example` contains placeholders only. Copy it to `.env.instagram-test`, which is ignored by Git, and replace placeholders privately with test-only values. Do not copy credentials from production. The preflight reads only `.env.instagram-test`; it never falls back to the repository `.env`.

All documented Compose commands go through `scripts/run-instagram-test-compose.js`. It removes shell-provided database, Redis, Compose, and Docker endpoint overrides, validates only the dedicated test file, requires a local named-pipe/Unix Docker context, and requires a timestamped test project. Its `preflight` checks the project is empty and its isolated PostgreSQL volume does not already exist before recording a short local marker. It rejects the scheduler and rejects `prisma db push`; the only allowed one-shot database command is `prisma migrate deploy` against the Compose API service.

The configuration requires a manually approved HTTPS test hostname, but no domain is assumed to exist. The frontend API URL must use that same origin with `/v1`. In isolated mode, missing API configuration fails closed, production API hosts are rejected, and the Next.js rewrite accepts only `http://127.0.0.1:4000` or `http://localhost:4000` as its local destination. Requests for `/v1/*` are proxied by the frontend server to the loopback-only API; the HTTPS tunnel targets frontend loopback port 3000. This keeps the browser callback and API under one site.

## Manual setup for a later approved run

Run these commands in one PowerShell window so `$project` stays the same for the whole test:

```powershell
Copy-Item .env.instagram-test.example .env.instagram-test
# Edit .env.instagram-test locally. Use only a new local DB password, test JWT/key material,
# the Meta app's test client values, and the exact HTTPS test origin approved by the owner.
npm run check:instagram-test-env

$project = "influnext-instagram-test-" + (Get-Date -Format "yyyyMMdd-HHmmss")
npm run instagram-test:compose -- $project preflight
npm run instagram-test:compose -- $project config --quiet
npm run instagram-test:compose -- $project ps -a
npm run instagram-test:compose -- $project build api worker
npm run instagram-test:compose -- $project up -d postgres redis
npm run instagram-test:compose -- $project run --rm api npx prisma migrate deploy
npm run instagram-test:compose -- $project up -d api worker
Invoke-WebRequest http://127.0.0.1:4000/health -UseBasicParsing | Select-Object -ExpandProperty StatusCode
Invoke-WebRequest http://127.0.0.1:4000/ready -UseBasicParsing | Select-Object -ExpandProperty StatusCode
npm run start:instagram-test:web
```

Use the generated project name for every Compose command in that run. It gives PostgreSQL a separate, newly named volume. The `preflight` must pass before any other command; it checks that no matching volume or project containers already exist. If it fails, choose a new project suffix. Do not use `down -v`. The migration command above is a future instruction and must only be run after the preflight succeeds and the empty, uniquely named test project has been confirmed. It applies only the versioned migrations to the new local PostgreSQL container; `db push` is never part of this procedure.

The API binds to `127.0.0.1:4000`; the isolated Next.js production server binds to `127.0.0.1:3000`. Check that both ports are available before starting. The API `/health` and `/ready` endpoints are local checks. Neither command starts a scheduler or calls an external provider.

## Callback, cookies, and Meta configuration

Set `FRONTEND_URL` and the sole `ALLOWED_ORIGINS` entry to the exact HTTPS test origin. Set `NEXT_PUBLIC_API_URL` to the same origin plus `/v1`. Set `INFLUNEXT_TEST_API_ORIGIN` to the loopback API origin. Leave `SESSION_COOKIE_DOMAIN` and `NEXT_PUBLIC_COOKIE_DOMAIN` unset so cookies are host-only.

The later redirect URI to register manually in the Meta app is exactly:

```text
https://<owner-approved-test-host>/auth/callback/instagram
```

Replace the placeholder with the chosen hostname; do not use `influnext.com.br` or another production hostname for this isolated run. Meta changes, a tunnel, and OAuth are intentionally not performed here. Production-mode API cookies are Secure; the OAuth nonce cookie is HttpOnly and Secure. The frontend wrapper passes only public API/site settings, forces an empty public cookie-domain override, and does not pass database passwords, JWT, Meta secret, AI key, or encryption keys.

## Data and worker safety

The overlay gives the test project its own PostgreSQL database name, credentials, and volume. PostgreSQL and Redis are available only on the Compose network. The worker is started explicitly and the scheduler is not. No AI key is mapped and the worker AI opt-in is explicitly disabled; snapshot persistence does not depend on or invoke AI. Instagram queue jobs contain identifiers and a reason, not OAuth tokens.

The project has these versioned migrations:

- `20260911131120_baseline_postgresql_schema`
- `20260915112639_add_social_platform_sync_state`
- `20260915112730_backfill_social_platform_sync_state`

They are not run as part of this setup step. Never point either database URL to production, staging, or `prisma/dev.db`.

## Test order when separately authorized

1. Confirm the isolated preflight passes and that the new Compose project is empty.
2. Start PostgreSQL and Redis, apply versioned migrations to that container, then start API and worker only.
3. Verify local `/health` and `/ready`, then start the guarded frontend.
4. Only after the HTTPS hostname, same-origin `/v1` proxy, Meta redirect URI, app test user, and test-only credentials have been reviewed should a separate authorization start OAuth.
5. During that later test, check the OAuth callback result, encrypted `SocialPlatform` token, token-free queue payload, worker logs, snapshot provenance, and dashboard freshness. Record statuses, timestamps, counts, and sanitized error codes only. Never capture authorization codes, cookies, tokens, secrets, or raw provider responses.

`NO_RECENT_MEDIA` is a valid collection outcome when a professional test account has no suitable media. It must not be converted into fabricated metrics or treated as proof that OAuth failed. A basic profile connection can be assessed separately from Insights availability; this step does not claim that Meta granted or approved the Insights permission.
