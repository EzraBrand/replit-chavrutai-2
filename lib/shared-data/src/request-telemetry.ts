export type TrafficClass =
  | "browser"
  | "search-crawler"
  | "other-bot"
  | "internal-ssr"
  | "internal-sitemap-proxy";

export type CacheOutcome = "hit" | "miss" | "coalesced" | "bypass" | "unknown";
export type InternalTrafficKind = "ssr" | "sitemap-proxy";

export interface RequestTelemetry {
  service: "web" | "api";
  method: string;
  route: string;
  status: number;
  responseBytes: number;
  latencyMs: number;
  cacheOutcome: CacheOutcome;
  trafficClass: TrafficClass;
}

const SEARCH_CRAWLER_RE =
  /(googlebot|bingbot|slurp|duckduckbot|baiduspider|yandexbot|applebot)/i;
const OTHER_BOT_RE =
  /(bot|crawler|spider|facebookexternalhit|twitterbot|linkedinbot|whatsapp|telegrambot|headless|lighthouse)/i;

export function classifyTraffic(
  userAgent: string | undefined,
  trustedInternalKind?: InternalTrafficKind,
): TrafficClass {
  if (trustedInternalKind === "ssr") return "internal-ssr";
  if (trustedInternalKind === "sitemap-proxy") return "internal-sitemap-proxy";
  const value = userAgent ?? "";
  if (/^chavrutai-(?:ssr|sitemap-proxy)(?:\s|$)/i.test(value)) {
    return "other-bot";
  }
  if (SEARCH_CRAWLER_RE.test(value)) return "search-crawler";
  if (OTHER_BOT_RE.test(value)) return "other-bot";
  return "browser";
}

const ROUTE_PATTERNS: Array<[RegExp, string]> = [
  [/^\/talmud\/[^/]+\/\d+[ab]$/i, "/talmud/:tractate/:folio"],
  [/^\/talmud\/[^/]+$/i, "/talmud/:tractate"],
  [/^\/mishnah\/[^/]+\/\d+$/i, "/mishnah/:tractate/:chapter"],
  [/^\/mishnah\/[^/]+$/i, "/mishnah/:tractate"],
  [/^\/yerushalmi\/[^/]+\/\d+(?:\.\d+)?$/i, "/yerushalmi/:tractate/:section"],
  [/^\/yerushalmi\/[^/]+$/i, "/yerushalmi/:tractate"],
  [/^\/bible\/[^/]+\/\d+$/i, "/bible/:book/:chapter"],
  [/^\/bible\/[^/]+$/i, "/bible/:book"],
  [/^\/rambam\/[^/]+\/\d+$/i, "/rambam/:hilchot/:chapter"],
  [/^\/rambam\/[^/]+$/i, "/rambam/:hilchot"],
  [/^\/(?:jastrow|bdb)\/headwords\/[^/]+$/i, "/:dictionary/headwords/:letter"],
  [/^\/scholarship\/[^/]+\/[^/]+$/i, "/scholarship/:work/:section"],
  [/^\/scholarship\/[^/]+$/i, "/scholarship/:work"],
  [/^\/outline\/[^/]+\/\d+$/i, "/outline/:tractate/:chapter"],
  [/^\/api\/sitemap(?:-[a-z-]+)?\.xml$/i, "/api/sitemap-*.xml"],
  [/^\/sitemap(?:-[a-z-]+)?\.xml$/i, "/sitemap-*.xml"],
  [/\.(?:js|mjs|css|map)$/i, "/static/code"],
  [/\.(?:png|jpe?g|gif|svg|webp|ico)$/i, "/static/image"],
  [/\.(?:woff2?|ttf|eot)$/i, "/static/font"],
];

export function normalizeTelemetryRoute(pathname: string): string {
  let path = pathname.split("?")[0] || "/";
  try {
    path = decodeURI(path);
  } catch {
    return "/invalid-encoding";
  }
  path = path.replace(/\/{2,}/g, "/");
  if (path.length > 1) path = path.replace(/\/+$/, "");
  for (const [pattern, label] of ROUTE_PATTERNS) {
    if (pattern.test(path)) return label;
  }

  // Express route templates are safe to retain. Numeric and unusually long
  // route parameters are still folded in case a handler uses a literal path.
  if (path.startsWith("/api/")) {
    return path
      .split("/")
      .map((segment, index) =>
        index > 1 && (/^\d+$/.test(segment) || segment.length > 48) ? ":value" : segment,
      )
      .join("/");
  }
  if (
    /^\/(?:|about|talmud|suggested-pages|privacy|search|sitemap|contact|changelog|jastrow|bdb|term-index|blog-posts|biblical-index|bible|sugya-viewer|mishnah-map|mishnah|yerushalmi|rambam|scholarship)$/.test(
      path,
    )
  ) {
    return path;
  }
  return "/other";
}

interface Aggregate {
  requests: number;
  bytes: number;
  latencyMs: number;
  errors: number;
  statusClasses: Record<"2xx" | "3xx" | "4xx" | "5xx" | "other", number>;
}

export interface TelemetryReport {
  event: "request_telemetry_report";
  service: "web" | "api";
  windowSeconds: number;
  totals: Aggregate;
  byTrafficClass: Array<Aggregate & { trafficClass: TrafficClass }>;
  byCacheOutcome: Array<Aggregate & { cacheOutcome: CacheOutcome }>;
  topRoutes: Array<Aggregate & { route: string }>;
  computeHeavyRoutes: Array<Aggregate & { route: string }>;
}

function emptyAggregate(): Aggregate {
  return {
    requests: 0,
    bytes: 0,
    latencyMs: 0,
    errors: 0,
    statusClasses: { "2xx": 0, "3xx": 0, "4xx": 0, "5xx": 0, other: 0 },
  };
}

function add(aggregate: Aggregate, event: RequestTelemetry): void {
  aggregate.requests++;
  aggregate.bytes += event.responseBytes;
  aggregate.latencyMs += event.latencyMs;
  if (event.status >= 500) aggregate.errors++;
  const statusClass =
    event.status >= 200 && event.status < 300
      ? "2xx"
      : event.status >= 300 && event.status < 400
        ? "3xx"
        : event.status >= 400 && event.status < 500
          ? "4xx"
          : event.status >= 500 && event.status < 600
            ? "5xx"
            : "other";
  aggregate.statusClasses[statusClass]++;
}

export class RequestTelemetryAggregator {
  private startedAt = Date.now();
  private totals = emptyAggregate();
  private readonly routes = new Map<string, Aggregate>();
  private readonly traffic = new Map<TrafficClass, Aggregate>();
  private readonly cacheOutcomes = new Map<CacheOutcome, Aggregate>();

  constructor(private readonly service: "web" | "api") {}

  record(event: RequestTelemetry): void {
    add(this.totals, event);
    const route = this.routes.get(event.route) ?? emptyAggregate();
    add(route, event);
    this.routes.set(event.route, route);
    const traffic = this.traffic.get(event.trafficClass) ?? emptyAggregate();
    add(traffic, event);
    this.traffic.set(event.trafficClass, traffic);
    const cacheOutcome = this.cacheOutcomes.get(event.cacheOutcome) ?? emptyAggregate();
    add(cacheOutcome, event);
    this.cacheOutcomes.set(event.cacheOutcome, cacheOutcome);
  }

  flush(): TelemetryReport | null {
    if (this.totals.requests === 0) return null;
    const windowSeconds = Math.max(1, Math.round((Date.now() - this.startedAt) / 1000));
    const routeRows = [...this.routes].map(([route, values]) => ({ route, ...values }));
    const report: TelemetryReport = {
      event: "request_telemetry_report",
      service: this.service,
      windowSeconds,
      totals: this.totals,
      byTrafficClass: [...this.traffic].map(([trafficClass, values]) => ({
        trafficClass,
        ...values,
      })),
      byCacheOutcome: [...this.cacheOutcomes].map(([cacheOutcome, values]) => ({
        cacheOutcome,
        ...values,
      })),
      topRoutes: [...routeRows]
        .sort((a, b) => b.requests - a.requests)
        .slice(0, 20),
      computeHeavyRoutes: [...routeRows]
        .sort((a, b) => b.latencyMs - a.latencyMs)
        .slice(0, 20),
    };
    this.startedAt = Date.now();
    this.totals = emptyAggregate();
    this.routes.clear();
    this.traffic.clear();
    this.cacheOutcomes.clear();
    return report;
  }
}