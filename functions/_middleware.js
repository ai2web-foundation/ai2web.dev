// AI2Web endpoints for ai2web.dev, served by a Cloudflare Pages Function.
//
// The site is otherwise static, so this middleware owns the /ai2w routes and returns real
// JSON instead of the SPA HTML. content and search are AUTO-GENERATED from the site's actual
// pages (parsed from sitemap.xml, with titles read from each page), not hand-declared. Every
// other request passes straight through to the static site via next().

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, OPTIONS",
  "access-control-allow-headers": "content-type, authorization",
};

function json(body, status = 200, extra = {}) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=300",
      ...CORS,
      ...extra,
    },
  });
}

function manifest(origin) {
  return {
    protocol: "ai2w",
    version: "0.1",
    site: {
      name: "AI2Web",
      url: origin,
      type: "content",
      description: "The open interoperability layer for AI-enabled websites.",
      languages: ["en"],
    },
    identity: {
      legal_name: "AI2Web Foundation",
      privacy_policy: origin + "/privacy",
      terms: origin + "/",
    },
    capabilities: {
      content: { enabled: true, endpoint: "/ai2w/content" },
      search: { enabled: true, endpoint: "/ai2w/search" },
    },
    transports: {
      rest: { enabled: true, base: "/ai2w" },
      feeds: { sitemap: "/sitemap.xml", llms: "/llms.txt" },
    },
    auth: { methods: ["none"] },
    contact: { support: "hello@ai2web.dev" },
  };
}

const ENTITIES = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'", "&#x27;": "'", "&apos;": "'" };
function decodeEntities(s) {
  return s.replace(/&amp;|&lt;|&gt;|&quot;|&#39;|&#x27;|&apos;/g, (m) => ENTITIES[m]);
}

function prettyTitle(pathname) {
  const slug = pathname.replace(/^\/+|\/+$/g, "");
  if (slug === "") return "Home";
  const last = slug.split("/").pop();
  return last.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// Build the content list from the real sitemap + each page's <title>/<meta description>.
// Cached at the edge so the fan-out only runs on a cache miss.
async function buildContent(origin) {
  const cacheKey = new Request(origin + "/ai2w/content", { method: "GET" });
  const cache = caches.default;
  try {
    const hit = await cache.match(cacheKey);
    if (hit) return await hit.json();
  } catch {}

  let xml = "";
  try {
    const r = await fetch(new URL("/sitemap.xml", origin).toString());
    if (r.ok) xml = await r.text();
  } catch {}
  const locs = [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)].map((m) => m[1].trim());
  const urls = locs.length ? locs : [origin + "/"];

  const items = await Promise.all(
    urls.map(async (u) => {
      let title = prettyTitle(new URL(u).pathname);
      let description = null;
      try {
        const res = await fetch(u, { headers: { "user-agent": "AI2Web/1.0 (+https://ai2web.dev)" } });
        if (res.ok) {
          const html = await res.text();
          const t = html.match(/<title[^>]*>([^<]*)<\/title>/i);
          if (t && t[1].trim()) title = decodeEntities(t[1].trim());
          const d = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i);
          if (d && d[1].trim()) description = decodeEntities(d[1].trim());
        }
      } catch {}
      return { type: "page", url: u, title, description };
    })
  );

  try {
    await cache.put(
      cacheKey,
      new Response(JSON.stringify(items), {
        headers: { "content-type": "application/json", "cache-control": "public, max-age=3600" },
      })
    );
  } catch {}
  return items;
}

// Capability negotiation (spec section 5): mirror of the SDK negotiator.
function negotiate(m, agent) {
  const enabled = (v) => v === true || (v && typeof v === "object" && v.enabled === true);
  const endpointOf = (name, v) => (v && typeof v === "object" && typeof v.endpoint === "string" ? v.endpoint : `/ai2w/${name}`);

  const siteCaps = Object.entries(m.capabilities || {}).filter(([, v]) => enabled(v)).map(([k]) => k);
  const want = Array.isArray(agent.capabilities) ? agent.capabilities : siteCaps;
  const caps = siteCaps.filter((c) => want.includes(c));
  const unsupported = want.filter((c) => !siteCaps.includes(c));

  const siteT = Object.entries(m.transports || {}).filter(([, v]) => v && typeof v === "object" && v.enabled === true).map(([k]) => k);
  const wantT = Array.isArray(agent.transports) ? agent.transports : siteT;
  const transport = wantT.find((t) => siteT.includes(t)) || null;

  const siteAuth = (m.auth && m.auth.methods) || ["none"];
  const wantAuth = Array.isArray(agent.auth) ? agent.auth : siteAuth;
  let auth = wantAuth.find((a) => siteAuth.includes(a)) || (siteAuth.includes("none") ? "none" : null);

  const endpoints = {};
  for (const c of caps) endpoints[c] = endpointOf(c, m.capabilities[c]);
  if (transport && m.transports[transport] && m.transports[transport].endpoint) endpoints[transport] = m.transports[transport].endpoint;

  return { negotiated: { transport, capabilities: caps, auth, endpoints }, unsupported };
}

export async function onRequest(context) {
  const { request, next } = context;
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, "") || "/";
  const origin = url.origin;

  if (path !== "/ai2w" && path !== "/.well-known/ai2w" && !path.startsWith("/ai2w/")) {
    return next();
  }

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }

  if (path === "/.well-known/ai2w") {
    return json({ ai2w: origin + "/ai2w" });
  }

  if (path === "/ai2w") {
    if (request.method !== "GET") return json({ error: { code: "invalid_request", message: "Use GET for the manifest." } }, 405);
    return json(manifest(origin));
  }

  if (path === "/ai2w/content") {
    return json(await buildContent(origin));
  }

  if (path === "/ai2w/search") {
    let q = url.searchParams.get("q") || "";
    if (!q && request.method === "POST") {
      const b = await request.json().catch(() => ({}));
      q = (b && (b.query || b.q)) || "";
    }
    const items = await buildContent(origin);
    const needle = String(q).toLowerCase().trim();
    const results = needle
      ? items.filter((i) => `${i.title} ${i.description || ""} ${i.url}`.toLowerCase().includes(needle))
      : [];
    return json({ query: q, count: results.length, results });
  }

  if (path === "/ai2w/negotiate") {
    const body = request.method === "POST" ? await request.json().catch(() => ({})) : {};
    const supports = (body && (body.agent?.supports || body.supports)) || body || {};
    return json(negotiate(manifest(origin), supports));
  }

  return json({ error: { code: "invalid_request", message: `No AI2Web route for ${path}.` } }, 404);
}
