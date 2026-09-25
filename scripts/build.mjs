// Builds the static site into dist/. No dependencies.
//
// Environment:
//   SITE_URL      Public URL of this site, with trailing slash. Set by the Pages workflow from
//                 actions/configure-pages, so a fork or a copy under another account needs no edits.
//   EMBED_ORIGIN  Where the widget iframe loads from (default https://qiblafind.net). Only
//                 override this to preview against another deployment.
//   LINK_ORIGIN   Where the "open the full tool" links point (default https://qiblafind.net).
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";

const withSlash = (u) => (u.endsWith("/") ? u : `${u}/`);
const SITE_URL = withSlash(process.env.SITE_URL || "http://localhost:8080/");
const EMBED_ORIGIN = (process.env.EMBED_ORIGIN || "https://qiblafind.net").replace(/\/$/, "");
const LINK_ORIGIN = (process.env.LINK_ORIGIN || "https://qiblafind.net").replace(/\/$/, "");

const now = new Date();
// The next Ramadan to show. Ramadan falls in January–March for the Gregorian years this site
// targets (through ~2030), so from April onward the next one is in the following year.
const RAMADAN_YEAR = now.getUTCMonth() >= 3 ? now.getUTCFullYear() + 1 : now.getUTCFullYear();

const vars = {
  SITE_URL,
  EMBED_ORIGIN,
  LINK_ORIGIN,
  YEAR: String(now.getUTCFullYear()),
  RAMADAN_YEAR: String(RAMADAN_YEAR),
  BUILD_DATE: now.toISOString().slice(0, 10),
};
const render = (text) =>
  text.replace(/\{\{([A-Z_]+)\}\}/g, (match, key) => {
    if (!(key in vars)) throw new Error(`Unknown placeholder ${match}`);
    return vars[key];
  });

rmSync("dist", { recursive: true, force: true });
mkdirSync("dist", { recursive: true });
cpSync("public", "dist", { recursive: true });
for (const page of ["index.html", "404.html"]) {
  writeFileSync(`dist/${page}`, render(readFileSync(`src/${page}`, "utf8")));
}
writeFileSync("dist/robots.txt", `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}sitemap.xml\n`);
writeFileSync(
  "dist/sitemap.xml",
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${SITE_URL}</loc><lastmod>${vars.BUILD_DATE}</lastmod></url>\n</urlset>\n`
);
writeFileSync("dist/.nojekyll", "");
console.log(`Built dist/ for ${SITE_URL} (widget from ${EMBED_ORIGIN})`);
