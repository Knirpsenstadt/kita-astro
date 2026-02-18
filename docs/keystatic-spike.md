# Keystatic Local-Mode Spike

This branch (`feat/keystatic-local-spike`) adds a Keystatic trial in local mode.

## What was added

- `keystatic.config.ts` with collections for:
  - `pages` -> `src/content/pages/*`
  - `events` -> `src/content/events/*`
  - `sponsors` -> `src/content/sponsors/*`
  - `home` singleton -> `src/content/home/index`
- Astro integrations in `astro.config.mjs`:
  - `@astrojs/markdoc`
  - `@keystatic/astro` (enabled only in `dev`)
- `dev` script now uses `astro dev`
- Footer/admin redirect now points to `/keystatic`

## Run locally

```bash
npm install
npm run dev
```

Open: `http://localhost:4321/keystatic` (or whichever port Astro prints).

## Why Keystatic integration is dev-only

Keystatic Admin UI requires server behavior. This project currently builds as static output.

To keep production/static builds working during the spike, Keystatic is only mounted for `astro dev`.

## Next step if we decide to switch fully

1. Remove Tina dependencies/config/scripts/routes.
2. Keep only Keystatic admin link and config.
3. Optionally add a server adapter if we want Keystatic UI enabled in deployed environments.
