# Frugal

A weekly budget and expense tracker built with React, TypeScript, Vite and Zustand.

## Run locally

```sh
npm ci
npm run dev
```

No account, backend, API key or environment variables are required. Budgets,
expenses, recurring expenses, one-off expenses and settings are saved in this
browser on this device. Other devices and browser profiles have separate data;
clearing site data removes the local records. The existing storage keys are
preserved, so records previously cached on the same origin remain available.
Data that exists only in the former remote database is not downloaded by this
version. No remote database or account is modified or deleted by this change.

## Verify and deploy

```sh
npm test
npm run build
npm run deploy
```

Cloudflare Pages project: `frugal-v2`. Keep the original origin
https://frugal-v2.pages.dev/ to retain access to existing browser records.
Download a full JSON archive from Settings to keep a separate copy of all five
stores. This download is an archive; this version does not include automatic
restore or device sync. The existing Analytics CSV export remains available.

`npm run lint` currently reports pre-existing React effect/fast-refresh issues
in eight places; the changed startup, header and stores pass targeted lint.

The `supabase/` directory contains historical schema files only; they are not
required to build, deploy or run Frugal.
