// Postbuild: write dist/sitemap.xml with a current <lastmod> so freshness signals stay accurate
// on every deploy (a hand-maintained static sitemap goes stale). Keep the URL list here.
import { writeFileSync } from "node:fs";

const SITE = "https://ai2web.dev";
const today = new Date().toISOString().slice(0, 10);

const pages = [
  { path: "/", priority: "1.0" },
  { path: "/docs", priority: "0.9" },
  { path: "/validator", priority: "0.9" },
  { path: "/privacy", priority: "0.3" },
];

const body = pages
  .map((p) => `  <url><loc>${SITE}${p.path}</loc><lastmod>${today}</lastmod><priority>${p.priority}</priority></url>`)
  .join("\n");

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`;

writeFileSync(new URL("../dist/sitemap.xml", import.meta.url), xml);
console.log(`✓ sitemap.xml generated (${pages.length} URLs, lastmod ${today})`);
