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
  never adopted automatically from a potentially still-open tab. Failed saves and
  conflicts are visible; a draft is never automatically rebased onto a newer
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
The checked-in D1 ID is deliberately a local-only placeholder. `npm run deploy`
fails closed until `account_id` and a real D1 `database_id` are configured.

Before first deployment:

1. Verify access to the actual owning Cloudflare account/project. An unrelated
   authenticated Wrangler account is insufficient. Do not create a replacement
   Pages project or change the public URL.
2. Check the current plan/limits; do not enable spending. Create a dedicated D1
   database, record its ID and the owning account ID in `wrangler.json`, then
   apply the additive migrations with `wrangler d1 migrations apply DB --remote`.
3. Set a strong production `AUTH_SECRET` through Pages secrets for `frugal-v2`.
   Omit `AUTH_ORIGIN` to use the fixed production origin. Local secrets are not
   deployment secrets. Do not reuse a local test secret.
4. Run the verification commands, then `npm run deploy`. The Functions and UI
   must ship together. Verify signup/login, account isolation, save/reload and
   native password hashing CPU limits at the live destination before declaring
   delivery complete. Local workerd results do not prove production quotas.

Do not share the production DB/secret with previews. Production account access,
real D1 binding and live delivery remain unverified until the above steps finish.
