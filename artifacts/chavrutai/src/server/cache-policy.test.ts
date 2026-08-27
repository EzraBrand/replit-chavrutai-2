import express from "express";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  CACHE_CONTROL,
  cacheControlForStaticFile,
} from "./cache-policy";

function rawGet(
  url: string,
  headers: Record<string, string> = {},
): Promise<{ status: number; headers: http.IncomingHttpHeaders }> {
  return new Promise((resolve, reject) => {
    const request = http.get(url, { headers }, (response) => {
      response.resume();
      response.once("end", () => {
        resolve({
          status: response.statusCode ?? 0,
          headers: response.headers,
        });
      });
    });
    request.once("error", reject);
  });
}

describe("production static cache headers", () => {
  let baseUrl = "";
  let closeServer: (() => Promise<void>) | undefined;
  let fixtureDir = "";

  beforeAll(async () => {
    fixtureDir = await fs.promises.mkdtemp(
      path.join(os.tmpdir(), "chavrutai-cache-policy-"),
    );
    await fs.promises.mkdir(path.join(fixtureDir, "assets"));
    await fs.promises.mkdir(path.join(fixtureDir, "data"));
    await Promise.all([
      fs.promises.writeFile(
        path.join(fixtureDir, "assets", "index-AbCd1234.js"),
        "console.log('versioned')",
      ),
      fs.promises.writeFile(
        path.join(fixtureDir, "data", "index.json"),
        '{"stable":true}',
      ),
      fs.promises.writeFile(
        path.join(fixtureDir, "index.html"),
        "<!doctype html>",
      ),
    ]);

    const app = express();
    app.use((_req, res, next) => {
      res.setHeader("Cache-Control", CACHE_CONTROL.revalidate);
      next();
    });
    app.use(
      express.static(fixtureDir, {
        index: false,
        etag: true,
        setHeaders(res, servedPath) {
          res.setHeader(
            "Cache-Control",
            cacheControlForStaticFile(servedPath),
          );
        },
      }),
    );

    await new Promise<void>((resolve) => {
      const server = app.listen(0, "127.0.0.1", () => {
        const address = server.address();
        if (!address || typeof address === "string") {
          throw new Error("Test server did not bind to a TCP port");
        }
        baseUrl = `http://127.0.0.1:${address.port}`;
        resolve();
      });
      closeServer = () =>
        new Promise<void>((closeResolve, reject) => {
          server.close((error) => (error ? reject(error) : closeResolve()));
        });
    });
  });

  afterAll(async () => {
    await closeServer?.();
    if (fixtureDir) await fs.promises.rm(fixtureDir, { recursive: true });
  });

  it("serves hashed bundles as public immutable resources", async () => {
    const response = await fetch(`${baseUrl}/assets/index-AbCd1234.js`);

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe(CACHE_CONTROL.immutable);
    expect(response.headers.get("cache-control")).not.toContain("max-age=0");
  });

  it("serves stable JSON with a shorter public TTL and ETag revalidation", async () => {
    const first = await rawGet(`${baseUrl}/data/index.json`);
    const etag = first.headers.etag;

    expect(first.headers["cache-control"]).toBe(CACHE_CONTROL.publicData);
    expect(etag).toBeTruthy();

    const revalidated = await rawGet(`${baseUrl}/data/index.json`, {
      "if-none-match": etag!,
    });
    expect(revalidated.status).toBe(304);
    expect(revalidated.headers["cache-control"]).toBe(
      CACHE_CONTROL.publicData,
    );
  });

  it("keeps HTML immediately revalidated", async () => {
    const response = await fetch(`${baseUrl}/index.html`);

    expect(response.headers.get("cache-control")).toBe(
      CACHE_CONTROL.revalidate,
    );
  });
});