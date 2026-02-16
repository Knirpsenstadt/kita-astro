# Kita Knirpsenstadt - Astro + TinaCMS Migration

## Overview

This document summarizes the migration from Jekyll to Astro with TinaCMS for the Kita Knirpsenstadt website.

## Project Location

```
/Users/stefan.remer/workspace/kita-astro
```

## Tech Stack

| Component | Technology |
|-----------|------------|
| Framework | Astro 5.x |
| Styling | Tailwind CSS + daisyUI |
| CMS | TinaCMS (self-hosted with TinaCloud Free) |
| Deployment | Vercel |
| Content | Markdown files in Git |

## Project Structure

```
kita-astro/
├── .env                          # Environment variables (TinaCloud credentials)
├── .env.example                  # Template for env vars
├── astro.config.mjs              # Astro configuration
├── tailwind.config.mjs           # Tailwind + daisyUI config
├── vercel.json                   # Vercel deployment config
├── package.json
├── public/
│   ├── uploads/                  # PDF documents
│   ├── img/
│   │   ├── slider/              # Carousel images (15 images)
│   │   └── sponsors/            # Sponsor logos
│   ├── favicon.ico
│   └── styles/
│       └── beitragsrechner.css  # Fee calculator styles
├── src/
│   ├── components/
│   │   ├── Calendar.astro       # Calendar widget (closures, events, festivities)
│   │   └── Carousel.astro       # Image slider
│   ├── content/
│   │   ├── pages/               # 8 content pages
│   │   ├── events/              # 30 calendar events
│   │   ├── sponsors/            # 2 sponsors
│   │   └── home/                # Homepage content
│   ├── content.config.ts        # Astro content collections schema
│   ├── layouts/
│   │   ├── BaseLayout.astro     # Main layout with header/footer
│   │   └── HomeLayout.astro     # Homepage with sidebar
│   ├── pages/
│   │   ├── index.astro          # Homepage
│   │   ├── [slug].astro         # Dynamic pages from content
│   │   ├── beitragsrechner.astro # Fee calculator
│   │   ├── impressum.astro      # Imprint page
│   │   └── sitemap.astro        # Sitemap page
│   └── scripts/
│       ├── calendar.js          # Calendar rendering logic
│       └── beitragsrechner.js   # Fee calculation logic
└── tina/
    └── config.ts                # TinaCMS schema definition
```

## Content Collections

### Pages (`src/content/pages/`)
Dynamic pages with the following frontmatter:
```yaml
---
title: "Page Title"
permalink: /page-slug/
showBadge: true
menuOrder: 1
---
Page content here...
```

### Events (`src/content/events/`)
Calendar events with types: `event`, `closure`, `festivity`:
```yaml
---
label: "Event Name"
type: event
start: 2025-06-15
end: 2025-06-16  # optional
---
```

### Sponsors (`src/content/sponsors/`)
Sponsor information:
```yaml
---
name: "Sponsor Name"
logo: "/img/sponsors/logo.png"
website: "https://example.com"
description: "Description text"
support: "How they support us"
---
```

### Home (`src/content/home/`)
Homepage content:
```yaml
---
title: "Startseite"
---
Homepage intro text...
```

## Commands

```bash
# Development (without Tina)
npm run dev

# Development with TinaCMS editor
npm run tina:dev

# Production build
npm run build

# Build with Tina codegen
npm run build:tina

# Preview production build
npm run preview
```

## TinaCMS Setup

### TinaCloud Free Tier
- 2 users (Admin + Editor)
- 2 roles
- Email/password authentication
- Built-in SMTP for invitations

### Setup Steps

1. Create account at [app.tina.io](https://app.tina.io) (GitHub login)

2. Create new project:
   - Connect your GitHub repository
   - Set site URLs:
     - `http://localhost:4321` (local)
     - `https://yourdomain.com` (production)
     - `https://*.vercel.app` (preview deployments)

3. Get credentials from TinaCloud dashboard

4. Update `.env`:
   ```
   TINA_CLIENT_ID=your_client_id
   TINA_TOKEN=your_token
   TINA_BRANCH=main
   ```

5. Access the CMS at `/admin` when running `npm run tina:dev`

## Vercel Deployment

### Environment Variables

Set these in Vercel dashboard:

| Variable | Value |
|----------|-------|
| `TINA_CLIENT_ID` | From TinaCloud dashboard |
| `TINA_TOKEN` | From TinaCloud dashboard |
| `TINA_BRANCH` | `main` |

### Build Settings

- **Framework**: Astro (auto-detected)
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

## Migration Script

A migration script is available to sync content from Jekyll to TinaCMS:

```bash
cd /Users/stefan.remer/workspace/kita
node scripts/migrate-to-tina.mjs
```

This migrates:
- `_data/events.yml` → `kita-astro/src/content/events/`
- `_data/closures.yml` → `kita-astro/src/content/events/`
- `_data/festivities.yml` → `kita-astro/src/content/events/`
- `_data/sponsors.yml` → `kita-astro/src/content/sponsors/`
- `_pages/*.md` → `kita-astro/src/content/pages/`

## Features Implemented

### Components

1. **Calendar** (`Calendar.astro`)
   - Monthly calendar view
   - Color-coded events (closure=red, festivity=green, event=blue)
   - Navigation between months
   - Click on day for details
   - Legend for event types

2. **Carousel** (`Carousel.astro`)
   - Auto-rotating image slider
   - Navigation arrows
   - 15 images from `public/img/slider/`

3. **Fee Calculator** (`beitragsrechner.astro`)
   - Full calculation logic ported from Jekyll
   - Krippe (under 3) and Kindergarten (3+) rates
   - Sibling discounts
   - Income-based rates
   - "Höchstsatz" (maximum rate) option
   - LocalStorage for form state persistence

### Layouts

1. **BaseLayout** - Main layout with:
   - Responsive navbar with mobile menu
   - Footer with imprint link
   - Font Awesome icons
   - Custom brand colors

2. **HomeLayout** - Homepage with:
   - "Freie Plätze" banner
   - Two-column layout (content + sidebar)
   - Opening hours table
   - Calendar widget
   - Image carousel

### Styling

- Tailwind CSS for utility classes
- daisyUI for component library (light theme)
- Custom CSS variables for brand colors:
  - `--brand-50` to `--brand-600` (green palette)
  - `--ink-700` (text color)
  - `--border`, `--shadow`

## Pages Built

| Page | URL | Source |
|------|-----|--------|
| Homepage | `/` | `src/pages/index.astro` |
| Pädagogischer Ansatz | `/paedagogischer-ansatz/` | content collection |
| Team | `/team/` | content collection |
| Kalender | `/kalender/` | content collection |
| Vereinsleben | `/vereinsleben/` | content collection |
| Sponsoren | `/sponsoren/` | content collection |
| Dokumente | `/dokumente/` | content collection |
| Offene Stellen | `/offene-stellen/` | content collection |
| Beitragsrechner | `/beitragsrechner/` | static page |
| Impressum | `/impressum/` | static page |
| Sitemap | `/sitemap/` | static page |

## Cost

**Total: $0/month**

| Service | Tier | Cost |
|---------|------|------|
| Vercel | Hobby | Free |
| TinaCloud | Free | Free (2 users, 2 roles) |
| GitHub | Public repo | Free |

## Next Steps

1. **TinaCloud Setup**
   - Create TinaCloud account
   - Connect repository
   - Configure `.env` with credentials

2. **Content Review**
   - Review migrated content in `src/content/`
   - Update placeholder content (impressum, etc.)

3. **Deploy to Vercel**
   - Connect GitHub repo to Vercel
   - Set environment variables
   - Deploy

4. **Custom Domain** (optional)
   - Add custom domain in Vercel
   - Update TinaCloud site URLs

5. **Invite Users**
   - Invite Admin via TinaCloud dashboard
   - Invite Editor via TinaCloud dashboard

## Files to Review Before Production

- `src/content/pages/impressum.md` - Update address, contact info
- `src/content/home/index.md` - Homepage content
- `public/uploads/` - Ensure all PDFs are copied
- `public/img/slider/` - Ensure all carousel images are present

## Troubleshooting

### Build Errors

If you see schema validation errors:
```bash
# Check content format matches schema in src/content.config.ts
cat src/content/events/some-file.md
```

### TinaCMS Not Loading

1. Verify `.env` has correct credentials
2. Check TinaCloud project settings match your URLs
3. Clear browser cache and try `/admin` again

### Images Not Loading

1. Check images exist in `public/img/`
2. Verify paths in content files start with `/img/` (not `/assets/img/`)

## Resources

- [Astro Docs](https://docs.astro.build)
- [TinaCMS Docs](https://tina.io/docs)
- [TinaCloud Dashboard](https://app.tina.io)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [daisyUI](https://daisyui.com/docs)
- [Vercel Docs](https://vercel.com/docs)
