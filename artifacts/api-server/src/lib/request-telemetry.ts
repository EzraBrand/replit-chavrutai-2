import type { RequestHandler } from "express";
import { createHmac, timingSafeEqual } from "node:crypto";
import {
  RequestTelemetryAggregator,
  classifyTraffic,
  normalizeTelemetryRoute,
  type CacheOutcome,
  type InternalTrafficKind,
  type RequestTelemetry,
} from "@workspace/shared-data/request-telemetry";
import { logger } from "./logger";

declare global {
  namespace Express {
    interface Locals {
      cacheOutcome?: CacheOutcome;
    }
  }
}

const aggregator = new RequestTelemetryAggregator("api");
const reportIntervalMs = Number(process.env.TELEMETRY_REPORT_INTERVAL_MS) || 60 * 60 * 1000;
const sampleRate = Math.min(
  1,
  Math.max(0, Number(process.env.TELEMETRY_SAMPLE_RATE ?? (process.env.NODE_ENV === "production" ? 0.01 : 1))),
);

const timer = setInterval(() => {
  const report = aggregator.flush();
  if (report) logger.info(report, "Aggregated request telemetry");
}, reportIntervalMs);
timer.unref();

function trustedInternalKind(
  header: string | undefined,
  method: string,
  path: string,
): InternalTrafficKind | undefined {
  const secret = process.env.SESSION_SECRET;
  if (!secret || !header) return undefined;
  const [kind, rawTimestamp, signature] = header.split(":");
  if (
    (kind !== "ssr" && kind !== "sitemap-proxy") ||
    !/^\d+$/.test(rawTimestamp ?? "") ||
    !/^[a-f0-9]{64}$/i.test(signature ?? "")
  ) {
    return undefined;
  }
  const timestamp = Number(rawTimestamp);
  if (Math.abs(Date.now() - timestamp) > 60_000) return undefined;
  const expected = createHmac("sha256", secret)
    .update(`${kind}:${timestamp}:${method}:${path}`)
    .digest();
  const supplied = Buffer.from(signature!, "hex");
  return supplied.length === expected.length && timingSafeEqual(supplied, expected)
    ? kind
    : undefined;
}

function byteLength(chunk: unknown, encoding?: BufferEncoding): number {
  if (Buffer.isBuffer(chunk)) return chunk.length;
  if (typeof chunk === "string") return Buffer.byteLength(chunk, encoding);
  if (chunk instanceof Uint8Array) return chunk.byteLength;
  return 0;
}

export const requestTelemetry: RequestHandler = (req, res, next) => {
  const startedAt = process.hrtime.bigint();
  let streamedBytes = 0;
  const originalWrite = res.write.bind(res);
  const originalEnd = res.end.bind(res);

  res.write = ((chunk: unknown, encoding?: BufferEncoding, callback?: () => void) => {
    streamedBytes += byteLength(chunk, encoding);
    return encoding
      ? originalWrite(chunk, encoding, callback)
      : originalWrite(chunk, callback);
  }) as typeof res.write;
  res.end = ((chunk?: unknown, encoding?: BufferEncoding, callback?: () => void) => {
    streamedBytes += byteLength(chunk, encoding);
    return encoding
      ? originalEnd(chunk, encoding, callback)
      : originalEnd(chunk, callback);
  }) as typeof res.end;

  res.once("finish", () => {
    const contentLength = Number(res.getHeader("content-length"));
    const matchedPath =
      typeof req.route?.path === "string"
        ? `${req.baseUrl}${req.route.path}`
        : req.route
          ? req.path
          : "/other";
    const event: RequestTelemetry = {
      service: "api",
      method: req.method,
      route: normalizeTelemetryRoute(matchedPath),
      status: res.statusCode,
      responseBytes:
        req.method === "HEAD"
          ? 0
          : Number.isFinite(contentLength)
            ? contentLength
            : streamedBytes,
      latencyMs: Math.round(Number(process.hrtime.bigint() - startedAt) / 1e6),
      cacheOutcome: res.locals.cacheOutcome ?? "unknown",
      trafficClass: classifyTraffic(
        req.get("user-agent"),
        trustedInternalKind(
          req.get("x-chavrutai-internal"),
          req.method,
          req.path,
        ),
      ),
    };
    aggregator.record(event);
    if (Math.random() < sampleRate) {
      logger.info({ event: "request_telemetry", ...event }, "Request telemetry sample");
    }
  });
  next();
};