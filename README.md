# Kita Knirpsenstadt (Astro)

Website for Elternverein Knirpsenstadt e.V. with an inline CMS workflow.

## Inline CMS workflow

- `draft` mode: edits are saved as draft entries.
- `published` mode: public visitors only see published entries.
- `publish` action: copies draft -> published in one step.
- preview route: `/vorschau` switches an authenticated admin into draft preview mode.

## Admin flow

1. Open `/admin`
2. Login with `CMS_ADMIN_PASSWORD`
3. Use `/vorschau` (or the toolbar mode switch) for inline text editing
4. Manage sponsors and carousel images directly in `/admin`
5. Click `Entwurf publizieren` when ready

### No-code content features in `/admin`

- Add, edit, and remove sponsor entries
- Upload sponsor logos directly
- Add carousel images by upload or URL
- Reorder and remove carousel images

## Storage modes

### GitHub mode (recommended for deployment)

Set these environment variables:

- `CMS_GITHUB_TOKEN`
- `CMS_GITHUB_REPO` (`owner/repo`)
- `CMS_GITHUB_BRANCH` (default: `main`)
- `CMS_GITHUB_FILE_PATH` (default: `cms/inline-cms.json`)

Draft and published content will be written via GitHub API commits.

### Local mode

If GitHub variables are not set, the CMS writes to a local file:

- `CMS_LOCAL_STORE_PATH` (default: `cms-data/inline-cms.json`)

## Development

```bash
npm install
npm run dev
```

## Environment

Copy `.env.example` to `.env` and set at least:

- `CMS_ADMIN_PASSWORD`
- `CMS_SESSION_SECRET`
