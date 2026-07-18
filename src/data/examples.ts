// Per-language code examples for the docs tabs. APIs mirror the real SDKs
// (ai2web-js/python/php/go/dotnet + the WordPress plugin).

export interface Tab {
  label: string;
  lang: string;
  code: string;
}

export const INSTALL: Tab[] = [
  { label: "TypeScript", lang: "bash", code: `npm install @ai2web/core       # types, builder, validation, discovery
npm install @ai2web/server     # /ai2w route handler (Node + Cloudflare)
npm install @ai2web/mcp-bridge # expose your capabilities as an MCP server` },
  { label: "JavaScript", lang: "bash", code: `npm install @ai2web/core       # ships as ESM with bundled types, no build step
npm install @ai2web/server     # /ai2w route handler (Node + Cloudflare)
# Or drop the build-free <ai2w-badge> web component into any page, no bundler.` },
  { label: "React", lang: "bash", code: `npm install @ai2web/core @ai2web/react
# hooks: useDiscover / useValidate / useNegotiate + <Ai2wBadge/>` },
  { label: "Python", lang: "bash", code: `pip install ai2web` },
  { label: "PHP", lang: "bash", code: `composer require ai2web/ai2web` },
  { label: "Go", lang: "bash", code: `go get github.com/ai2web-foundation/ai2web-go` },
  { label: ".NET", lang: "bash", code: `dotnet add package Ai2Web` },
  { label: "WordPress", lang: "bash", code: `# Install the "AI2Web" plugin from the WordPress admin, then enable it.
# It serves /ai2w automatically from your posts, products and pages.` },
];

export const QUICKSTART: Tab[] = [
  {
    label: "TypeScript",
    lang: "typescript",
    code: `import { ai2web, validateManifest } from "@ai2web/core";

const manifest = ai2web({ name: "Northwind", url: "https://northwind.com", type: "ecommerce" })
  .capability("content")
  .capability("commerce", { endpoint: "/ai2w/products", checkout: true })
  .capability("search", { endpoint: "/ai2w/search" })
  .transports({ mcp: { enabled: true, endpoint: "/ai2w/mcp" }, rest: { enabled: true } })
  .auth({ methods: ["none", "oauth2"], oauth2: { pkce: true, scopes: ["checkout"] } })
  .consent({ requires_user_approval_for: ["purchase"] })
  .contact({ support: "help@northwind.com" })
  .build();

const { score, tier } = validateManifest(manifest); // 100, "Enterprise"`,
  },
  {
    label: "JavaScript",
    lang: "javascript",
    code: `import { ai2web, validateManifest } from "@ai2web/core";

// The packages ship as standard ESM, so plain JavaScript works unchanged.
const manifest = ai2web({ name: "Northwind", url: "https://northwind.com", type: "ecommerce" })
  .capability("content")
  .capability("commerce", { endpoint: "/ai2w/products", checkout: true })
  .transports({ mcp: { enabled: true, endpoint: "/ai2w/mcp" }, rest: { enabled: true } })
  .contact({ support: "help@northwind.com" })
  .build();

console.log(validateManifest(manifest).score); // 90+`,
  },
  {
    label: "React",
    lang: "tsx",
    code: `import { Ai2wBadge, useValidate } from "@ai2web/react";

export function Readiness() {
  // Fetches /ai2w for the URL and scores it, live.
  const { result, loading } = useValidate("https://northwind.com");

  if (loading) return <span>Scanning...</span>;
  return (
    <div>
      <Ai2wBadge url="https://northwind.com" />
      <p>Score: {result?.score}/100 - {result?.tier}</p>
    </div>
  );
}`,
  },
  {
    label: "Python",
    lang: "python",
    code: `from ai2web import Manifest, validate_manifest

manifest = (
    Manifest.for_site("Northwind", "https://northwind.com", "ecommerce")
    .capability("content")
    .capability("commerce", {"endpoint": "/ai2w/products", "checkout": True})
    .capability("search", {"endpoint": "/ai2w/search"})
    .transports({"mcp": {"enabled": True, "endpoint": "/ai2w/mcp"}, "rest": {"enabled": True}})
    .auth({"methods": ["none", "oauth2"], "oauth2": {"pkce": True, "scopes": ["checkout"]}})
    .consent({"requires_user_approval_for": ["purchase"]})
    .contact({"support": "help@northwind.com"})
    .build()
)

result = validate_manifest(manifest)   # {"score": 100, "tier": "Enterprise", ...}`,
  },
  {
    label: "PHP",
    lang: "php",
    code: `use Ai2Web\\Manifest;
use Ai2Web\\Validator;

$manifest = Manifest::forSite('Northwind', 'https://northwind.com', 'ecommerce')
    ->capability('content')
    ->capability('commerce', ['endpoint' => '/ai2w/products', 'checkout' => true])
    ->capability('search', ['endpoint' => '/ai2w/search'])
    ->transports(['mcp' => ['enabled' => true, 'endpoint' => '/ai2w/mcp'], 'rest' => ['enabled' => true]])
    ->auth(['methods' => ['none', 'oauth2'], 'oauth2' => ['pkce' => true, 'scopes' => ['checkout']]])
    ->consent(['requires_user_approval_for' => ['purchase']])
    ->contact(['support' => 'help@northwind.com'])
    ->build();

$result = Validator::validate($manifest);   // ['score' => 100, 'tier' => 'Enterprise']`,
  },
  {
    label: "Go",
    lang: "go",
    code: `import "github.com/ai2web-foundation/ai2web-go"

manifest := ai2web.ForSite("Northwind", "https://northwind.com", "ecommerce").
    Capability("content", true).
    Capability("commerce", map[string]any{"endpoint": "/ai2w/products", "checkout": true}).
    Capability("search", map[string]any{"endpoint": "/ai2w/search"}).
    Transports(map[string]any{
        "mcp":  map[string]any{"enabled": true, "endpoint": "/ai2w/mcp"},
        "rest": map[string]any{"enabled": true},
    }).
    Auth(map[string]any{"methods": []string{"none", "oauth2"}, "oauth2": map[string]any{"pkce": true}}).
    Consent(map[string]any{"requires_user_approval_for": []string{"purchase"}}).
    Contact(map[string]any{"support": "help@northwind.com"}).
    Build()

result := ai2web.Validate(manifest)   // score 100, tier "Enterprise"`,
  },
  {
    label: ".NET",
    lang: "csharp",
    code: `using Ai2Web;

var manifest = Manifest.ForSite("Northwind", "https://northwind.com", "ecommerce")
    .Capability("content")
    .Capability("commerce", new() { ["endpoint"] = "/ai2w/products", ["checkout"] = true })
    .Capability("search", new() { ["endpoint"] = "/ai2w/search" })
    .Transports(new() {
        ["mcp"]  = new Dictionary<string, object?> { ["enabled"] = true, ["endpoint"] = "/ai2w/mcp" },
        ["rest"] = new Dictionary<string, object?> { ["enabled"] = true },
    })
    .Auth(new() { ["methods"] = new[] { "none", "oauth2" } })
    .Consent(new() { ["requires_user_approval_for"] = new[] { "purchase" } })
    .Contact(new() { ["support"] = "help@northwind.com" })
    .Build();

var result = Validator.Validate(manifest);   // Score 100, Tier "Enterprise"`,
  },
  {
    label: "WordPress",
    lang: "text",
    code: `The AI2Web plugin generates your manifest automatically. No code required:

1. Install and activate the "AI2Web" plugin.
2. It maps your content, WooCommerce products and pages to capabilities.
3. /ai2w and /.well-known/ai2w go live instantly, scored 100/100.
4. Optional: enable Agent checkout and OAuth2 + PKCE in Settings -> AI2Web.

Works with WordPress 7.0 native AI (Abilities API + AI Client).`,
  },
];

export const SERVE: Tab[] = [
  {
    label: "TypeScript",
    lang: "typescript",
    code: `import { cloudflareHandler } from "@ai2web/server";

// One handler serves /ai2w, /.well-known/ai2w, actions, and the
// /llms.txt + /.well-known/agent.json projections from a single manifest.
export default cloudflareHandler({ manifest });`,
  },
  {
    label: "JavaScript",
    lang: "javascript",
    code: `import { createServer } from "node:http";
import { nodeListener } from "@ai2web/server";

// Serves /ai2w, the well-known anchor, actions and the llms.txt +
// agent.json projections from one manifest.
createServer(nodeListener({ manifest })).listen(3000);`,
  },
  {
    label: "Python",
    lang: "python",
    code: `from ai2web import handle

# Framework-agnostic: hand it the request method + path, get status/headers/body.
res = handle({"manifest": manifest}, request.method, request.path)
return Response(res["body"], status=res["status"], headers=res["headers"])`,
  },
  {
    label: "PHP",
    lang: "php",
    code: `use Ai2Web\\Server;

$res = Server::handle(['manifest' => $manifest],
    $_SERVER['REQUEST_METHOD'],
    parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));

http_response_code($res['status']);
foreach ($res['headers'] as $k => $v) { header("$k: $v"); }
echo json_encode($res['body']);`,
  },
  {
    label: "Go",
    lang: "go",
    code: `res := ai2web.Handle(
    ai2web.ServerOptions{Manifest: manifest},
    r.Method, r.URL.Path, nil, "",
)
for k, v := range res.Headers {
    w.Header().Set(k, v)
}
w.WriteHeader(res.Status)
json.NewEncoder(w).Encode(res.Body)`,
  },
  {
    label: ".NET",
    lang: "csharp",
    code: `using Ai2Web;

var res = Server.Handle(manifest, ctx.Request.Method, ctx.Request.Path);

ctx.Response.StatusCode = res.Status;
foreach (var (k, v) in res.Headers) ctx.Response.Headers[k] = v;
await ctx.Response.WriteAsJsonAsync(res.Body);`,
  },
];
