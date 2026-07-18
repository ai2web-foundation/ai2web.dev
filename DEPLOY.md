# Deploying ai2web.dev

The site is a static Astro build. Output goes to `dist/` and is served by Cloudflare Pages.

## Build

```bash
npm install
npm run build      # -> dist/
```

## Deploy to Cloudflare Pages

**Git integration (recommended).** In the Cloudflare dashboard, create a Pages project from this repo and set:

- Build command: `npm run build`
- Build output directory: `dist`
- Node version: 20 or newer (set `NODE_VERSION=20` as an environment variable if needed)

Every push to the production branch then builds and deploys automatically.

**Direct upload (from your machine):**

```bash
npm run build
npx wrangler pages deploy dist --project-name ai2web
```

## Notes

- `public/_headers` ships security headers and immutable caching for `/_astro/*` build assets.
- `public/robots.txt` and `public/sitemap.xml` are served at the site root.
- The site dogfoods AI2Web: `public/llms.txt` is present and `<link rel="ai2w" href="/ai2w">` is emitted.
- Fonts are self-hosted (Inter + JetBrains Mono via `@fontsource-variable`), so the pages make no external requests.

## Replacing the current static site

This project lives in `ai2web-web/` and does not touch the existing hand-written
`ai2web.dev/` site. To cut over: point the Cloudflare Pages project (or the
`ai2web.dev` domain) at this build, verify in production, then retire the old
static files. Keep `/ai2w`, `/.well-known/ai2w`, and any Pages Functions from the
old site working (or port them) before switching DNS.
