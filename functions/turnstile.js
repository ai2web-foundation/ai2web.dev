// GET /turnstile - a minimal, isolated page that renders the Cloudflare Turnstile widget and
// postMessages the token to the parent. The validator page embeds this in a same-origin <iframe>
// so the widget runs in a clean document, immune to whatever on the main page was breaking
// Turnstile's init ("already loaded" / render never attached). The site key comes from env.
export async function onRequestGet({ env }) {
  const key = (env && env.SITE_KEY) || "";
  const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="color-scheme" content="light dark" />
    <style>html,body{margin:0;padding:0;background:transparent;overflow:hidden}</style>
  </head>
  <body>
    <div class="cf-turnstile" data-sitekey="${key}" data-theme="auto"
         data-callback="ai2wCb" data-expired-callback="ai2wClr"
         data-error-callback="ai2wClr" data-timeout-callback="ai2wClr"></div>
    <script>
      function ai2wPost(t){ try { parent.postMessage({ __ai2wTurnstile: t }, location.origin); } catch (e) {} }
      function ai2wCb(t){ ai2wPost(t); }
      function ai2wClr(){ ai2wPost(""); }
    </script>
    <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
  </body>
</html>`;
  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      // Only our own pages may frame it.
      "x-frame-options": "SAMEORIGIN",
      "content-security-policy": "frame-ancestors 'self'",
    },
  });
}
