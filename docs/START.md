# Quick Start Guide

## 1. First Time Setup

```bash
cd /Users/stefan.remer/workspace/kita-astro
npm install
```

## 2. Development

```bash
# Start dev server (without CMS)
npm run dev

# Open http://localhost:4321
```

## 3. TinaCMS Setup (Required for Content Editing)

1. Go to https://app.tina.io
2. Sign in with GitHub
3. Create new project
4. Copy `TINA_CLIENT_ID` and `TINA_TOKEN`
5. Update `.env`:
   ```
   TINA_CLIENT_ID=<your_client_id>
   TINA_TOKEN=<your_token>
   ```
6. Run with Tina:
   ```bash
   npm run tina:dev
   ```
7. Access CMS at http://localhost:4321/admin

## 4. Deploy to Vercel

```bash
# Install Vercel CLI (optional)
npm i -g vercel

# Or connect repo via vercel.com dashboard
```

Set environment variables in Vercel:
- `TINA_CLIENT_ID`
- `TINA_TOKEN`
- `TINA_BRANCH=main`

## 5. Re-migrate Content (if needed)

```bash
cd /Users/stefan.remer/workspace/kita
node scripts/migrate-to-tina.mjs
```

## Useful Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run tina:dev` | Dev with TinaCMS editor |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |

## Need Help?

See full documentation: `docs/MIGRATION_SUMMARY.md`
