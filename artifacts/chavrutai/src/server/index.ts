import { CANONICAL_BASE_URL as PROD_BASE_URL } from "@workspace/shared-data/brand";
import express from "express";
import fs from "node:fs";
import path from "node:path";
import { createHmac } from "node:crypto";
import { fileURLToPath } from "node:url";
import { getPageSEO } from "@workspace/shared-data/seo-data";
import { isKnownAppPath, getNotFoundSEO } from "@workspace/shared-data/route-validation";
import { resolveLegacyRedirect } from "@workspace/shared-data/legacy-redirects";
import {
  RequestTelemetryAggregator,
  classifyTraffic,
  normalizeTelemetryRoute,
  type RequestTelemetry,
} from "@workspace/shared-data/request-telemetry";
import {
  normalizeSeoEnhancementKey,
  SeoEnhancementCache,
} from "./seo-enhancement-cache";
import {
  CACHE_CONTROL,
  cacheControlForStaticFile,
} from "./cache-policy";

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

function internalRequestHeader(
  kind: "ssr" | "sitemap-proxy",
  method: string,
  pathname: string,
): string | undefined {
  const secret = process.env.SESSION_SECRET;
  if (!secret) return undefined;
  const timestamp = Date.now();
  const signature = createHmac("sha256", secret)
    .update(`${kind}:${timestamp}:${method}:${pathname}`)
    .digest("hex");
  return `${kind}:${timestamp}:${signature}`;
}

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

function positiveIntegerEnv(name: string, fallback: number): number {
  const parsed = Number(process.env[name]);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

const enhancementCache = new SeoEnhancementCache<SeoEnhancement>(
  positiveIntegerEnv("SEO_ENHANCE_CACHE_MAX_ENTRIES", 512),
  positiveIntegerEnv("SEO_ENHANCE_CACHE_TTL_MS", 24 * 60 * 60 * 1000),
);

// Fetch the storage-backed enhancement (JSON-LD + pre-rendered body) from the
// api-server through the shared proxy at a FIXED base URL (ENHANCE_BASE_URL).
// The destination never depends on inbound request headers, so a spoofed Host
// or X-Forwarded-Proto cannot redirect this server-side call. Degrades
// gracefully: if the api-server is slow or unreachable, the page still ships
// with correct meta tags.
async function fetchEnhancement(pathAndQuery: string): Promise<SeoEnhancement> {
  const target = `${ENHANCE_BASE_URL}/api/seo/enhance?path=${encodeURIComponent(pathAndQuery)}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000);
  try {
    const internalHeader = internalRequestHeader(
      "ssr",
      "GET",
      "/api/seo/enhance",
    );
    const resp = await fetch(target, {
      signal: controller.signal,
      headers: {
        "user-agent": "chavrutai-ssr",
        ...(internalHeader ? { "x-chavrutai-internal": internalHeader } : {}),
      },
    });
    if (!resp.ok) {
      throw new Error(`SEO enhancement request failed with status ${resp.status}`);
    }
    return (await resp.json()) as SeoEnhancement;
  } finally {
    clearTimeout(timeout);
  }
}

const app = express();
const telemetryAggregator = new RequestTelemetryAggregator("web");
const telemetrySampleRate = Math.min(
  1,
  Math.max(0, Number(process.env.TELEMETRY_SAMPLE_RATE ?? (process.env.NODE_ENV === "production" ? 0.01 : 1))),
);
const telemetryTimer = setInterval(() => {
  const report = telemetryAggregator.flush();
  if (report) process.stdout.write(`${JSON.stringify(report)}\n`);
}, Number(process.env.TELEMETRY_REPORT_INTERVAL_MS) || 60 * 60 * 1000);
telemetryTimer.unref();

// Dynamic responses and HTML revalidate by default so a deployment is visible
// immediately. Static resources override this below according to their URL
// stability.
app.use((_req, res, next) => {
  res.setHeader("Cache-Control", CACHE_CONTROL.revalidate);
  next();
});

app.use((req, res, next) => {
  const startedAt = process.hrtime.bigint();
  let streamedBytes = 0;
  const originalWrite = res.write.bind(res);
  const originalEnd = res.end.bind(res);
  const count = (chunk: unknown, encoding?: BufferEncoding) => {
    if (Buffer.isBuffer(chunk)) streamedBytes += chunk.length;
    else if (typeof chunk === "string") streamedBytes += Buffer.byteLength(chunk, encoding);
    else if (chunk instanceof Uint8Array) streamedBytes += chunk.byteLength;
  };
  res.write = ((chunk: unknown, encoding?: BufferEncoding, callback?: () => void) => {
    count(chunk, encoding);
    return encoding
      ? originalWrite(chunk, encoding, callback)
      : originalWrite(chunk, callback);
  }) as typeof res.write;
  res.end = ((chunk?: unknown, encoding?: BufferEncoding, callback?: () => void) => {
    count(chunk, encoding);
    return encoding
      ? originalEnd(chunk, encoding, callback)
      : originalEnd(chunk, callback);
  }) as typeof res.end;
  res.once("finish", () => {
    const contentLength = Number(res.getHeader("content-length"));
    const route = normalizeTelemetryRoute(req.path);
    const event: RequestTelemetry = {
      service: "web",
      method: req.method,
      route,
      status: res.statusCode,
      responseBytes:
        req.method === "HEAD"
          ? 0
          : Number.isFinite(contentLength)
            ? contentLength
            : streamedBytes,
      latencyMs: Math.round(Number(process.hrtime.bigint() - startedAt) / 1e6),
      cacheOutcome: res.locals.cacheOutcome ?? "bypass",
      trafficClass: classifyTraffic(req.get("user-agent")),
    };
    telemetryAggregator.record(event);
    if (Math.random() < telemetrySampleRate) {
      process.stdout.write(`${JSON.stringify({ event: "request_telemetry", ...event })}\n`);
    }
  });
  next();
});

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

// Legacy path redirects (/contents, /contents/:tractate, /dictionary): 301 to
// the current URL scheme, preserving query strings. Shares one mapping with
// the api-server (external sites still link to the historical paths).
app.use((req, res, next) => {
  const target = resolveLegacyRedirect(req.path);
  if (target) {
    const queryIndex = req.originalUrl.indexOf("?");
    const query = queryIndex === -1 ? "" : req.originalUrl.slice(queryIndex);
    return res.redirect(301, `${target}${query}`);
  }
  next();
});

// Sitemap proxy: the sitemap generators live on the api-server, which the
// shared proxy exposes under the /api prefix. Serve /sitemap.xml and every
// /sitemap-*.xml at the root domain by fetching the /api-prefixed route over
// the same FIXED base URL used for SEO enhancement (never derived from inbound
// Host headers). On failure return 503 — never the SPA HTML shell — so
// crawlers can't index an HTML page as a sitemap.
const SITEMAP_PATH_RE = /^\/sitemap(-[a-z-]+)?\.xml$/;
app.get(SITEMAP_PATH_RE, async (req, res) => {
  try {
    const target = `${ENHANCE_BASE_URL}/api${req.path}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const internalHeader = internalRequestHeader(
        "sitemap-proxy",
        "GET",
        `/api${req.path}`,
      );
      const resp = await fetch(target, {
        signal: controller.signal,
        headers: {
          "user-agent": "chavrutai-sitemap-proxy",
          ...(internalHeader ? { "x-chavrutai-internal": internalHeader } : {}),
        },
      });
      if (!resp.ok) {
        res.status(503).type("text/plain").send("Sitemap temporarily unavailable");
        return;
      }
      const xml = await resp.text();
      res.status(200).set("Content-Type", "application/xml").send(xml);
    } finally {
      clearTimeout(timeout);
    }
  } catch {
    res.status(503).type("text/plain").send("Sitemap temporarily unavailable");
  }
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

    // Unknown content URLs (bad tractate/folio/book/chapter, unmatched routes)
    // get a real HTTP 404 with noindex meta instead of a soft-404 200 shell.
    if (!isKnownAppPath(urlObj.pathname)) {
      template = injectMeta(
        template,
        getNotFoundSEO(urlObj.pathname, CANONICAL_BASE_URL),
      );
      res.status(404).set({ "Content-Type": "text/html" }).end(template);
      return;
    }

    const seoData = getPageSEO(urlObj.pathname, urlObj.searchParams, CANONICAL_BASE_URL);

    template = injectMeta(template, seoData);

    const enhancementKey = normalizeSeoEnhancementKey(req.originalUrl);
    const enhancementLoad = enhancementCache.load(
      enhancementKey,
      () => fetchEnhancement(enhancementKey),
    );
    res.locals.cacheOutcome = enhancementLoad.outcome;
    const enhancement = await enhancementLoad.value.catch(() => null);
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

// Content-hashed build assets are immutable; stable public data and media use
// shorter TTLs and retain Express ETags for conditional revalidation.
app.use(
  express.static(publicDir, {
    index: false,
    etag: true,
    setHeaders(res, servedPath) {
      res.setHeader("Cache-Control", cacheControlForStaticFile(servedPath));
    },
  }),
);

// SPA fallback: every remaining route returns the client shell so direct URL
// access and client-side routing work. Unknown content URLs still get the
// shell (so React renders the NotFound page) but with HTTP 404 + noindex meta
// so crawlers don't index them as soft 404s.
app.use(async (req, res) => {
  try {
    const pathname = new URL(req.originalUrl, CANONICAL_BASE_URL).pathname;
    if (!isKnownAppPath(pathname)) {
      const template = injectMeta(
        await fs.promises.readFile(indexHtmlPath, "utf-8"),
        getNotFoundSEO(pathname, CANONICAL_BASE_URL),
      );
      res.status(404).set({ "Content-Type": "text/html" }).end(template);
      return;
    }
  } catch {
    // On any validation/read error, fall through to the plain shell.
  }
  res.sendFile(indexHtmlPath);
});

app.listen(port, "0.0.0.0", () => {
  process.stdout.write(`chavrutai server listening on port ${port}\n`);
});
