import { describe, expect, it, vi } from "vitest";
import {
  RequestTelemetryAggregator,
  classifyTraffic,
  normalizeTelemetryRoute,
} from "@workspace/shared-data/request-telemetry";

describe("request telemetry privacy helpers", () => {
  it("classifies internal calls before generic bots", () => {
    expect(classifyTraffic("chavrutai-ssr", "ssr")).toBe("internal-ssr");
    expect(classifyTraffic("chavrutai-sitemap-proxy", "sitemap-proxy")).toBe(
      "internal-sitemap-proxy",
    );
    expect(classifyTraffic("chavrutai-ssr")).toBe("other-bot");
    expect(classifyTraffic("chavrutai-sitemap-proxy")).toBe("other-bot");
    expect(classifyTraffic("Googlebot/2.1")).toBe("search-crawler");
    expect(classifyTraffic("ExampleCrawler")).toBe("other-bot");
    expect(classifyTraffic("Mozilla/5.0")).toBe("browser");
  });

  it("drops queries and folds content and static paths", () => {
    expect(normalizeTelemetryRoute("/talmud/Berakhot/2a?private=value")).toBe(
      "/talmud/:tractate/:folio",
    );
    expect(normalizeTelemetryRoute("/assets/index-secret123.js")).toBe("/static/code");
    expect(normalizeTelemetryRoute("/api/text?work=sensitive")).toBe("/api/text");
  });

  it("does not retain arbitrary text paths", () => {
    expect(normalizeTelemetryRoute("/שלום/פרטי")).toBe("/other");
    expect(normalizeTelemetryRoute("/private-medical-note")).toBe("/other");
    expect(normalizeTelemetryRoute(`/${"x".repeat(130)}`)).toBe("/other");
  });

  it("reports request, byte, traffic, and compute aggregates", () => {
    vi.useFakeTimers();
    const aggregator = new RequestTelemetryAggregator("api");
    aggregator.record({
      service: "api",
      method: "GET",
      route: "/api/text",
      status: 200,
      responseBytes: 100,
      latencyMs: 40,
      cacheOutcome: "hit",
      trafficClass: "browser",
    });
    aggregator.record({
      service: "api",
      method: "GET",
      route: "/api/text",
      status: 500,
      responseBytes: 20,
      latencyMs: 60,
      cacheOutcome: "miss",
      trafficClass: "internal-ssr",
    });
    const report = aggregator.flush();
    expect(report?.totals).toMatchObject({
      requests: 2,
      bytes: 120,
      latencyMs: 100,
      errors: 1,
      statusClasses: { "2xx": 1, "3xx": 0, "4xx": 0, "5xx": 1, other: 0 },
    });
    expect(report?.topRoutes[0]).toMatchObject({ route: "/api/text", requests: 2 });
    expect(report?.byTrafficClass).toHaveLength(2);
    expect(report?.byCacheOutcome).toHaveLength(2);
    expect(aggregator.flush()).toBeNull();
    vi.useRealTimers();
  });
});