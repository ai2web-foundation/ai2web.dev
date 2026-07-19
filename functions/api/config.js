// GET /api/config -> public front-end config. Exposes the Turnstile *site* key (which is public and
// meant to appear in the page) from the Pages environment, so the widget is driven by the same
// secret store as verification and never hard-coded.
export async function onRequestGet({ env }) {
  return new Response(JSON.stringify({ turnstileSiteKey: env.SITE_KEY || null }), {
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "public, max-age=300" },
  });
}
