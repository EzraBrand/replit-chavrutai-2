import { CANONICAL_BASE_URL as PROD_BASE_URL } from "@workspace/shared-data/brand";
import express from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getPageSEO } from "@workspace/shared-data/seo-data";

// After esbuild bundling, this file is emitted to dist/index.mjs and the Vite
// build output lives alongside it at dist/public.
const bundleDir = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(bundleDir, "public");
const indexHtmlPath = path.resolve(publicDir, "index.html");

const rawPort = process.env.PORT;
if (!rawPort) {
  throw new Error("PORT environment variable is required but was not provided.");
}
const port = Number(rawPort);
if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

// Canonical/base URL used for meta tags. Mirrors the api-server's SEO logic so
// crawler-facing canonical and og:url values point at the production domain.
const CANONICAL_BASE_URL =
  process.env.NODE_ENV === "production"
    ? PROD_BASE_URL
    : `http://localhost:${port}`;

// Fixed destination for the internal SEO-enhancement call. We deliberately do
// NOT derive this from inbound Host/X-Forwarded-Proto headers (that would be a
// host-header SSRF primitive). In production we reach the api-server through the
// shared proxy on the canonical domain; in dev through the local proxy on :80.
// Override with SEO_ENHANCE_BASE_URL if the api-server lives elsewhere.
const ENHANCE_BASE_URL =
  process.env.SEO_ENHANCE_BASE_URL ||
  (process.env.NODE_ENV === "production"
    ? PROD_BASE_URL
    : "http://localhost:80");

const ASSET_EXTENSION_RE =
  /\.(js|mjs|css|map|png|jpg|jpeg|gif|svg|webp|ico|webmanifest|json|txt|xml|woff|woff2|ttf|eot)$/i;

const CRAWLER_PATTERNS = [
  /googlebot/i,
  /bingbot/i,
  /slurp/i,
  /duckduckbot/i,
  /baiduspider/i,
  /yandexbot/i,
  /facebookexternalhit/i,
  /twitterbot/i,
  /linkedinbot/i,
  /whatsapp/i,
  /telegrambot/i,
  /applebot/i,
  /crawler/i,
  /spider/i,
  /bot/i,
];

function isCrawlerRequest(userAgent: string): boolean {
  return CRAWLER_PATTERNS.some((pattern) => pattern.test(userAgent));
}

function escapeHtmlAttr(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

interface SeoMeta {
  title: string;
  description: string;
  ogTitle: string;
  ogDescription: string;
  canonical: string;
  robots: string;
}

function injectMeta(template: string, seoData: SeoMeta): string {
  let result = template
    .replace(/<title>.*?<\/title>/, `<title>${escapeHtmlAttr(seoData.title)}</title>`)
    .replace(
      /<meta name="description" content=".*?"/,
      `<meta name="description" content="${escapeHtmlAttr(seoData.description)}"`,
    )
    .replace(
      /<meta property="og:title" content=".*?"/,
      `<meta property="og:title" content="${escapeHtmlAttr(seoData.ogTitle)}"`,
    )
    .replace(
      /<meta property="og:description" content=".*?"/,
      `<meta property="og:description" content="${escapeHtmlAttr(seoData.ogDescription)}"`,
    )
    .replace(
      /<meta property="og:url" content=".*?"/,
      `<meta property="og:url" content="${escapeHtmlAttr(seoData.canonical)}"`,
    )
    .replace(
      /<meta name="robots" content=".*?"/,
      `<meta name="robots" content="${seoData.robots}"`,
    );

  if (result.includes('<link rel="canonical"')) {
    result = result.replace(
      /<link rel="canonical" href=".*?" \/>/,
      `<link rel="canonical" href="${escapeHtmlAttr(seoData.canonical)}" />`,
    );
  } else {
    result = result.replace(
      "</head>",
      `  <link rel="canonical" href="${escapeHtmlAttr(seoData.canonical)}" />\n  </head>`,
    );
  }

  return result;
}

function injectStructuredData(template: string, structuredData: object): string {
  const json = JSON.stringify(structuredData, null, 2);
  if (template.includes("application/ld+json")) {
    return template.replace(
      /<script type="application\/ld\+json">[\s\S]*?<\/script>/,
      `<script type="application/ld+json">\n${json}\n  </script>`,
    );
  }
  return template.replace(
    "</head>",
    `  <script type="application/ld+json">\n${json}\n  </script>\n  </head>`,
  );
}

interface SeoEnhancement {
  structuredData: object | null;
  bodyContent: string;
}

// Fetch the storage-backed enhancement (JSON-LD + pre-rendered body) from the
// api-server through the shared proxy at a FIXED base URL (ENHANCE_BASE_URL).
// The destination never depends on inbound request headers, so a spoofed Host
// or X-Forwarded-Proto cannot redirect this server-side call. Degrades
// gracefully: if the api-server is slow or unreachable, the page still ships
// with correct meta tags.
async function fetchEnhancement(pathAndQuery: string): Promise<SeoEnhancement | null> {
  try {
    const target = `${ENHANCE_BASE_URL}/api/seo/enhance?path=${encodeURIComponent(pathAndQuery)}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    try {
      const resp = await fetch(target, {
        signal: controller.signal,
        headers: { "user-agent": "chavrutai-ssr" },
      });
      if (!resp.ok) return null;
      return (await resp.json()) as SeoEnhancement;
    } finally {
      clearTimeout(timeout);
    }
  } catch {
    return null;
  }
}

const app = express();

// Domain canonicalization: permanently redirect legacy/alias domains to the
// canonical bekiut.com. We compare against an explicit allowlist of known
// legacy hosts (never redirect unknown hosts, so dev/preview domains and
// direct health checks are unaffected). The Host header is only compared,
// never used to build the redirect target's domain.
const LEGACY_HOSTS = new Set([
  "chavrutai.com",
  "www.chavrutai.com",
  "www.bekiut.com",
  "bekiut.net",
  "www.bekiut.net",
  "bekiut.org",
  "www.bekiut.org",
]);
app.use((req, res, next) => {
  const host = (req.headers.host || "").toLowerCase().split(":")[0];
  if (LEGACY_HOSTS.has(host)) {
    return res.redirect(301, `${PROD_BASE_URL}${req.originalUrl}`);
  }
  next();
});

// Crawler interceptor: serve per-page meta/JSON-LD/body for bots only. Human
// visitors fall through to static assets + the SPA shell unchanged.
app.use(async (req, res, next) => {
  if (req.method !== "GET" && req.method !== "HEAD") return next();

  const userAgent = req.get("user-agent") || "";
  if (!isCrawlerRequest(userAgent)) return next();
  if (ASSET_EXTENSION_RE.test(req.path)) return next();

  try {
    let template = await fs.promises.readFile(indexHtmlPath, "utf-8");
    const urlObj = new URL(req.originalUrl, CANONICAL_BASE_URL);
    const seoData = getPageSEO(urlObj.pathname, urlObj.searchParams, CANONICAL_BASE_URL);

    template = injectMeta(template, seoData);

    const enhancement = await fetchEnhancement(req.originalUrl);
    if (enhancement?.structuredData) {
      template = injectStructuredData(template, enhancement.structuredData);
    }
    if (enhancement?.bodyContent) {
      template = template.replace(
        '<div id="root"></div>',
        `${enhancement.bodyContent}\n    <div id="root"></div>`,
      );
    }

    res.status(200).set({ "Content-Type": "text/html" }).end(template);
  } catch {
    // Fall back to the static SPA shell on any rendering error.
    next();
  }
});

// Static assets (hashed JS/CSS, images, robots.txt, sitemap.xml, etc.).
app.use(express.static(publicDir, { index: false }));

// SPA fallback: every remaining route returns the client shell so direct URL
// access and client-side routing work.
app.use((_req, res) => {
  res.sendFile(indexHtmlPath);
});

app.listen(port, "0.0.0.0", () => {
  process.stdout.write(`chavrutai server listening on port ${port}\n`);
});
