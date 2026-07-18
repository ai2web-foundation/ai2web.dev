# ai2web.dev

The AI2Web marketing site and validator, built with [Astro](https://astro.build) and deployed on Cloudflare Pages.

```bash
npm install
npm run dev      # local dev server
npm run build    # static output -> dist/
```

- `src/` - pages, components, layouts, styles and data
- `public/` - static assets (logos, robots.txt, sitemap.xml, llms.txt, _headers, _redirects)
- `functions/_middleware.js` - Cloudflare Pages Function that serves the site's own AI2Web
  endpoints (`/ai2w`, `/.well-known/ai2w`, `/ai2w/content`, `/ai2w/search`, `/ai2w/mcp`,
  `/ai2w/negotiate`); every other request passes through to the static build.

See [DEPLOY.md](./DEPLOY.md) for Cloudflare Pages settings.

Licence: MIT.
