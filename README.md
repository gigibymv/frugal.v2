# Frugal

A weekly budget and expense tracker with simple email/password accounts, built
with React, Better Auth and Cloudflare Pages Functions + D1. Supabase is not
needed for authentication, storage, builds or deployment.

## Local development

Requires Node 24 or later.

```sh
npm ci
```

Create `.dev.vars` (ignored by Git) with `AUTH_ORIGIN="http://127.0.0.1:8788"`
and a random `AUTH_SECRET` of at least 32 characters. Use a separate secret for
production; never put it in frontend environment variables or commit it.

```sh
npm run db:local
npm run dev:full
```

Open http://127.0.0.1:8788. The frontend-only `npm run dev` command does not start
account APIs; use the full local server to sign up and save data.

## Accounts and data

- Create an account with email and an 8–128 character password; signup signs in
  immediately. Sign in on another device to retrieve the same saved budget.
- Passwords use Better Auth's native scrypt implementation. Sessions use
  HttpOnly cookies, Secure on the production HTTPS origin, and database-backed
  rate limiting. Recovery email and email verification are not configured.
- Every budget API request checks the session and the expected account ID.
  Revision checks reject stale writes from another tab/device. Exact retry IDs
  make a lost save response safe to retry.
- Unsaved drafts stay under account- and document-specific browser keys. A tab
  cannot delete another tab's draft; a per-tab pointer permits reload recovery.
  After a tab is closed, other account drafts remain visible through the header
  and Settings, where they can be downloaded and explicitly restored. They are
  never adopted automatically from a potentially still-open tab. Small pending saves are flushed with keepalive on hide/page exit when possible.
  Failed saves and conflicts are visible; a draft is never automatically rebased onto a newer
  cloud version. A conflict offers draft download and explicit cloud reload.
- Download full JSON data from Settings; CSV expenses remain in Analytics.
  Settings can restore the JSON archive after an explicit confirmation naming
  the destination account. Previous browser archives can be restored the same way.

## Transition from the former version

Existing Supabase accounts/passwords and remote records are not automatically
migrated or matched by email. Users must create a new Frugal account. No former
remote database or account is deleted or modified by this code.

Legacy browser keys remain untouched. They are not automatically assigned or
uploaded to a new account, because they have no verified owner. When present,
the sign-in page offers an explicit download of those previous browser records.
The `supabase/` directory retains historical schema files only.

## Offline recovery from the former database

A one-time private export can be converted without reconnecting the application
to Supabase:

```sh
node scripts/convert-supabase-export.mjs --input /private/path/export.json --output-dir /private/path/new-backups --expected-project-ref zoeirjelygmmastmgfui
node scripts/check-supabase-export.mjs
```

The input is an explicit, sanitized JSON export of source user UUIDs and the old
budget/expense tables. Never include authentication hashes or tokens. The
converter validates all rows against the current snapshot schema, preserves
source budget history, reports duplicate content, and creates private files in
a new directory. It does not assign accounts, upload data or merge current
snapshots. Keep exports and login details outside this repository.

Recovery into a live account requires an explicit source-to-destination ownership
mapping, a destination backup, revision protection, and readback verification.
An equal unverified email is insufficient proof of ownership. Never replace an
existing account snapshot blindly or restore another user's records into it.

## Verification

```sh
npm test
npm run typecheck:server
npm run build
# With the full local server running:
npm run test:api
```

`npm test` covers account switching, late replies, retained drafts, save ordering,
unknown-outcome replay, conflicts, legacy preservation and recurring generation.
The local-only API suite checks real signup/login, sessions, two-user isolation,
origin checks, revision/retry rules, validation, deletions, limits and signout.
It refuses to target a remote host and creates only disposable local accounts.

`npm run lint` has eight pre-existing findings in form effects and shared UI
exports; the new auth, sync, server and validation files pass targeted lint.

Auth SQL was generated from the pinned Better Auth configuration using
`node server/generate-auth-schema.mjs`. Do not regenerate/overwrite an applied
migration; future schema changes need a new additive migration.

## Production setup

Keep the existing `frugal-v2` project and https://frugal-v2.pages.dev/ origin.
Its verified owning account is `17ced8b33ac43682371a9755c8c38887`, as recorded
by the successful Cloudflare Pages production deployment.
The deployment guard requires this exact account; an authenticated session for
another account cannot deploy this project.
The production D1 binding is configured in `wrangler.json`. The deployment
script uses the separate Wrangler profile `frugal` (or an explicitly supplied API
credential) and pins the verified owning account through `CLOUDFLARE_ACCOUNT_ID`; Pages
configuration does not accept an `account_id` field. Preview deployments have
no production D1 binding. The deployment guard rejects local placeholder IDs.

Before first deployment:

1. Verify access to the actual owning Cloudflare account/project. An unrelated
   authenticated Wrangler account is insufficient. Do not create a replacement
   Pages project or change the public URL.
2. Check the current plan/limits; do not enable spending. Use the dedicated D1
   database recorded in `wrangler.json`, then
   apply the additive migrations with `wrangler d1 migrations apply DB --remote`.
3. Set a strong production `AUTH_SECRET` through Pages secrets for `frugal-v2`.
   Omit `AUTH_ORIGIN` to use the fixed production origin. Local secrets are not
   deployment secrets. Do not reuse a local test secret.
4. Run the verification commands, then `npm run deploy`. The Functions and UI
   must ship together. Verify signup/login, account isolation, save/reload and
   native password hashing CPU limits at the live destination before declaring
   delivery complete. Local workerd results do not prove production quotas.

Do not share the production DB/secret with previews.

Production was deployed and verified on 2026-10-31. Live checks passed for
signup, secure sessions, login/logout, save/reload, two-account isolation,
origin enforcement, stale-write rejection and exact retry replay. The browser
confirmed that data saved through another client loaded into the account.
The dedicated D1 migrations are applied; legacy Supabase environment variables
have been removed from production and previews. Node 24 is configured for both.
