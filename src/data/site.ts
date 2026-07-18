export const SITE = {
  name: "AI2Web",
  tagline: "Describe your website once. AI2Web makes it understandable to every AI.",
  org: "ai2web-foundation",
  repo: "ai2web-foundation/ai2web-spec",
  ghUrl: "https://github.com/ai2web-foundation",
};

export const NAV = [
  { label: "Docs", href: "/docs" },
  { label: "Spec", href: "https://github.com/ai2web-foundation/ai2web-spec" },
  { label: "Validator", href: "/validator" },
];

export const CHROME_EXT = {
  name: "AI2Web AI Readiness Checker",
  href: "https://chromewebstore.google.com/detail/ai2web-ai-readiness-check/dgfgbjlpmhahoafdcfandobbncfjhlle",
  blurb: "Check any site's AI readiness from your toolbar as you browse. No setup.",
};

// Distribution channels for the Get Started section. `badge` is a short lettermark
// shown in a tinted tile (no remote logos - keeps the page zero-external-request).
export const CHANNELS = [
  { badge: "npm", name: "npm", pkg: "@ai2web/core", cmd: "npm i @ai2web/core", href: "https://www.npmjs.com/package/@ai2web/core" },
  { badge: "py", name: "PyPI", pkg: "ai2web", cmd: "pip install ai2web", href: "https://pypi.org/project/ai2web/" },
  { badge: "php", name: "Packagist", pkg: "ai2web/ai2web", cmd: "composer require ai2web/ai2web", href: "https://packagist.org/packages/ai2web/ai2web" },
  { badge: "C#", name: "NuGet", pkg: "Ai2Web", cmd: "dotnet add package Ai2Web", href: "https://www.nuget.org/packages/Ai2Web" },
  { badge: "go", name: "Go", pkg: "ai2web-go", cmd: "go get github.com/ai2web-foundation/ai2web-go", href: "https://pkg.go.dev/github.com/ai2web-foundation/ai2web-go" },
  { badge: "wp", name: "WordPress", pkg: "ai2web plugin", cmd: "Install from your WP admin", href: "https://github.com/ai2web-foundation/ai2web-wordpress" },
];

// Last-known total, shown when the build-time fetch is unavailable (e.g. GitHub's
// unauthenticated rate limit). Bump when convenient; a successful build refreshes it live.
const FALLBACK_STARS = 16;

let _starsCache: Promise<number> | undefined;

/**
 * Total stars across the org, fetched ONCE at BUILD time (memoized across pages) and baked
 * into the HTML, so the client makes no request. Always resolves to a number: the live total
 * when the fetch succeeds, otherwise FALLBACK_STARS, so the nav never loses the count.
 */
export function getStars(): Promise<number> {
  return (_starsCache ??= fetchStars());
}

async function fetchStars(): Promise<number> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 4000);
    const res = await fetch(
      `https://api.github.com/orgs/${SITE.org}/repos?per_page=100&type=public`,
      { headers: { accept: "application/vnd.github+json", "user-agent": "ai2web-site-build" }, signal: ctrl.signal }
    );
    clearTimeout(t);
    if (!res.ok) return FALLBACK_STARS;
    const repos = (await res.json()) as Array<{ stargazers_count?: number }>;
    if (!Array.isArray(repos) || repos.length === 0) return FALLBACK_STARS;
    const total = repos.reduce((n, r) => n + (r.stargazers_count ?? 0), 0);
    return total > 0 ? total : FALLBACK_STARS;
  } catch {
    return FALLBACK_STARS;
  }
}

export function fmtStars(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, "") + "k";
  return String(n);
}
