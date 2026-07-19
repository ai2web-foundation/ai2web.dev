// POST /api/register  { url, token }
//
// Turnstile gate in front of the Discovery Network register. Verifies a Cloudflare Turnstile token
// and applies a light per-IP rate limit, then proxies to directory.ai2web.dev/register (which does
// its own verification-first listing and rate limiting). Errors use the directory's { error: {code,
// message} } shape so the page's existing handler surfaces them unchanged.

const DIRECTORY_REGISTER = "https://directory.ai2web.dev/register";
const TURNSTILE_VERIFY = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

const RATE_LIMIT = 8; // submissions
const RATE_WINDOW = 60; // seconds

const json = (status, body, extra = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...extra },
  });

const gateError = (status, code, message, extra = {}) => json(status, { error: { code, message } }, extra);

async function rateLimited(ip) {
  try {
    const cache = caches.default;
    const bucket = Math.floor(Date.now() / 1000 / RATE_WINDOW);
    const key = new Request(`https://rl.ai2web.dev/register/${encodeURIComponent(ip)}/${bucket}`);
    const prev = await cache.match(key);
    const count = prev ? parseInt(await prev.text(), 10) || 0 : 0;
    if (count >= RATE_LIMIT) return true;
    await cache.put(key, new Response(String(count + 1), { headers: { "cache-control": `max-age=${RATE_WINDOW}` } }));
    return false;
  } catch {
    return false;
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
  try { body = await request.json(); } catch { return gateError(400, "invalid_request", "Invalid JSON body."); }
  const url = body && typeof body.url === "string" ? body.url.trim() : "";
  const token = body && typeof body.token === "string" ? body.token : "";
  if (!url) return gateError(400, "invalid_request", "url required");

  if (await rateLimited(ip)) {
    return gateError(429, "rate_limited", "Too many submissions. Please wait a minute and try again.", { "retry-after": String(RATE_WINDOW) });
  }

  // Verify Turnstile only if a token is present; a missing token falls through to the rate limit
  // (the directory also does its own verification-first listing + rate limit downstream).
  if (env.SECRET_KEY && token) {
    if (!(await turnstileOk(token, ip, env.SECRET_KEY))) {
      return gateError(403, "turnstile_failed", "Verification failed. Please try again.");
    }
  }

  // Proxy to the directory (send only the URL; the directory re-fetches and verifies the manifest).
  try {
    const res = await fetch(DIRECTORY_REGISTER, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url }),
    });
    const text = await res.text();
    return new Response(text, {
      status: res.status,
      headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
    });
  } catch {
    return gateError(502, "upstream_unavailable", "The directory is unreachable, please try again.");
  }
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: { "cache-control": "no-store" } });
}
