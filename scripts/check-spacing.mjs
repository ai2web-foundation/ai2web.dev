// Build guard: catches the JSX whitespace-trim bug where Astro drops the space
// between prose and an adjacent inline <a>/<code> across a line break, producing
// glued text like "no signup ·read the docs" or "state. The/llms.txt".
//
// Runs on the built HTML (dist/), so it sees exactly what ships. Escaped code in
// <pre> blocks is "&lt;code", not "<code ", so real code samples never false-match.
// Runs as `postbuild`, so a regression fails the build instead of shipping.

import { readdirSync, statSync, readFileSync } from "node:fs";
import { join } from "node:path";

const DIST = "dist";

function htmlFiles(dir) {
  const out = [];
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) out.push(...htmlFiles(p));
    else if (e.endsWith(".html")) out.push(p);
  }
  return out;
}

// A word/sentence-punctuation char glued directly to an opening inline element (missing space
// before), or an inline close glued to a word (missing space after). Legit adjacencies like
// "(<code", "><a", or whitespace are excluded by the character classes.
const BEFORE = /([\w.,;:!?)·%])<(a|code)[ >]/g;   // e.g. "signup ·<a ", "The<code "
const AFTER = /<\/(a|code)>(\w)/g;                 // e.g. "</code>projections"

const findings = [];
for (const f of htmlFiles(DIST)) {
  const html = readFileSync(f, "utf8");
  for (const re of [BEFORE, AFTER]) {
    for (const m of html.matchAll(re)) {
      const ctx = html.slice(Math.max(0, m.index - 25), m.index + m[0].length + 15).replace(/\s+/g, " ");
      findings.push(`${f}: ...${ctx}...`);
    }
  }
}

if (findings.length) {
  console.error(`\n✗ spacing check: ${findings.length} glued inline element(s) (missing space):`);
  for (const x of findings) console.error("   " + x);
  console.error("\nFix: add an explicit {\" \"} at the line break before/after the inline element.\n");
  process.exit(1);
}
console.log("✓ spacing check clean");
