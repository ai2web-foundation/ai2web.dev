// POST /api/validate  { url, token }
//
// Gate in front of the validator Worker (validator.ai2web.dev): verifies a Cloudflare Turnstile
// token and applies a per-IP rate limit, then proxies the scan. Keeps the abuse controls (and the
// SITE_KEY / SECRET_KEY Pages secrets) on ai2web.dev, leaving the scoring Worker unchanged.

const VALIDATOR = "https://validator.ai2web.dev/validate";
const TURNSTILE_VERIFY = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

// Per-IP fixed-window limit (a courtesy throttle; Turnstile is the real abuse gate).
const RATE_LIMIT = 15; // scans
const RATE_WINDOW = 60; // seconds

const json = (status, body, extra = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...extra },
  });

// Cache-API fixed-window limiter - no extra binding required. Per-colo (not globally strict), which
// is fine as a courtesy throttle behind Turnstile. Bind KV or add a WAF rate-limit rule for a hard,
// global limit.
async function rateLimited(ip) {
  try {
    const cache = caches.default;
    const bucket = Math.floor(Date.now() / 1000 / RATE_WINDOW);
    const key = new Request(`https://rl.ai2web.dev/validate/${encodeURIComponent(ip)}/${bucket}`);
    const prev = await cache.match(key);
    const count = prev ? parseInt(await prev.text(), 10) || 0 : 0;
    if (count >= RATE_LIMIT) return true;
    await cache.put(key, new Response(String(count + 1), { headers: { "cache-control": `max-age=${RATE_WINDOW}` } }));
    return false;
  } catch {
    return false; // never let the limiter break a legitimate scan
  }
}

async function turnstileOk(token, ip, secret) {
  const form = new URLSearchParams();
  form.append("secret", secret);
  form.append("response", token);
  if (ip) form.append("remoteip", ip);
  try {
    const r = await fetch(TURNSTILE_VERIFY, { method: "POST", body: form });
    const data = await r.json();
    return data && data.success === true;
  } catch {
    return false;
  }
}

export async function onRequestPost({ request, env }) {
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";

  let body;
  try { body = await request.json(); } catch { return json(400, { error: "invalid_request", message: "Invalid JSON body." }); }
  const url = (body && typeof body.url === "string" ? body.url : "").trim();
  const token = body && typeof body.token === "string" ? body.token : "";
  if (!url) return json(400, { error: "invalid_request", message: "url required" });

  if (await rateLimited(ip)) {
    return json(429, { error: "rate_limited", message: "Too many scans. Please wait a minute and try again." }, { "retry-after": String(RATE_WINDOW) });
  }

  // Turnstile is enforced whenever the secret is configured (it is, in production).
  if (env.SECRET_KEY) {
    if (!token) return json(403, { error: "turnstile_required", message: "Please complete the verification challenge." });
    if (!(await turnstileOk(token, ip, env.SECRET_KEY))) {
      return json(403, { error: "turnstile_failed", message: "Verification failed. Please try again." });
    }
  }

  // Proxy the scan to the validator Worker and pass its JSON straight back.
  try {
    const res = await fetch(`${VALIDATOR}?url=${encodeURIComponent(url)}`, {
      headers: { "user-agent": "AI2Web-Validator-Proxy/1.0 (+https://ai2web.dev)" },
    });
    const text = await res.text();
    return new Response(text, {
      status: res.status,
      headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
    });
  } catch {
    return json(502, { error: "upstream_unavailable", message: "The validator is unreachable, please try again." });
  }
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: { "cache-control": "no-store" } });
}
