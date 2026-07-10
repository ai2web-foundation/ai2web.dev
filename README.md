# ai2web.dev

The marketing + docs site and the **web validator**. Self-contained static `index.html` - no build, no external dependencies (works offline, deploy anywhere).

## What's on it
- Hero + the story: *Describe your website once. AI2Web makes it understandable to every AI.*
- The layered model: `Capability Model → Framework → Discovery Network → Analytics`.
- The six questions the manifest answers + transport taxonomy.
- **Live AI Readiness Validator** - paste a manifest → per-capability ✓/⚠ + score/100 + tier, using the same algorithm as `@ai2web/core` / `npx ai2web validate`.

## Run
Just open `index.html`, or serve the folder:
```bash
python -m http.server -d ai2web.dev 8080
```

## Deploy (Cloudflare Pages)
It's fully static - deploy the folder directly, no build:
```bash
npx wrangler pages deploy ai2web.dev --project-name ai2web-dev
```
Or connect the repo in the Cloudflare dashboard with build output dir = `ai2web.dev`. The web validator runs client-side, so no server is needed. To dogfood a live `/ai2w` on the domain, add a Pages Function (or route a Worker using `@ai2web/server`).

## Roadmap
Convert to a full docs site (spec, SDK reference, examples, playground, RFCs) - the source of truth, versioned. This static page is the launch landing + validator MVP.
