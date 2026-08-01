import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

const rawPort = process.env.PORT;

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const basePath = process.env.BASE_PATH;

if (!basePath) {
  throw new Error(
    "BASE_PATH environment variable is required but was not provided.",
  );
}

// Dev-only sitemap proxy. In production the express server (src/server/index.ts)
// proxies /sitemap*.xml to the api-server; in dev Vite serves the app, so this
// middleware provides the same behavior. Fixed base URL (local shared proxy) —
// never derived from inbound Host headers.
const SITEMAP_PATH_RE = /^\/sitemap(-[a-z-]+)?\.xml$/;
const sitemapDevProxy = () => ({
  name: "sitemap-dev-proxy",
  configureServer(server: import("vite").ViteDevServer) {
    server.middlewares.use(async (req, res, next) => {
      const urlPath = (req.url || "").split("?")[0];
      if (req.method !== "GET" || !SITEMAP_PATH_RE.test(urlPath)) return next();
      try {
        const resp = await fetch(`http://localhost:80/api${urlPath}`, {
          headers: { "user-agent": "chavrutai-sitemap-proxy" },
        });
        if (!resp.ok) {
          res.statusCode = 503;
          res.setHeader("Content-Type", "text/plain");
          res.end("Sitemap temporarily unavailable");
          return;
        }
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/xml");
        res.end(await resp.text());
      } catch {
        res.statusCode = 503;
        res.setHeader("Content-Type", "text/plain");
        res.end("Sitemap temporarily unavailable");
      }
    });
  },
});

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    sitemapDevProxy(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, ".."),
            }),
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  css: {
    postcss: {
      plugins: [
        (await import("tailwindcss")).default,
        (await import("autoprefixer")).default,
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
      "@shared": path.resolve(import.meta.dirname, "src", "shared"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    port,
    strictPort: true,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: false,
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
