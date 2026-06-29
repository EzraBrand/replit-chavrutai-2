import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build as esbuild } from "esbuild";
import { rm } from "node:fs/promises";

globalThis.require = createRequire(import.meta.url);

const artifactDir = path.dirname(fileURLToPath(import.meta.url));

// Bundles the production SEO/static server into dist/index.mjs. This runs AFTER
// `vite build` (which populates dist/public), so it must NOT remove the dist
// directory — only the previous server bundle.
async function buildServer() {
  const distDir = path.resolve(artifactDir, "dist");
  await rm(path.resolve(distDir, "index.mjs"), { force: true });
  await rm(path.resolve(distDir, "index.mjs.map"), { force: true });

  await esbuild({
    entryPoints: [path.resolve(artifactDir, "src/server/index.ts")],
    platform: "node",
    bundle: true,
    format: "esm",
    outdir: distDir,
    outExtension: { ".js": ".mjs" },
    logLevel: "info",
    external: [
      "*.node",
      "sharp",
      "better-sqlite3",
      "sqlite3",
      "canvas",
      "bcrypt",
      "argon2",
      "fsevents",
      "lightningcss",
      "pg-native",
    ],
    sourcemap: "linked",
    banner: {
      js: `import { createRequire as __bannerCrReq } from 'node:module';
import __bannerPath from 'node:path';
import __bannerUrl from 'node:url';

globalThis.require = __bannerCrReq(import.meta.url);
globalThis.__filename = __bannerUrl.fileURLToPath(import.meta.url);
globalThis.__dirname = __bannerPath.dirname(globalThis.__filename);
    `,
    },
  });
}

buildServer().catch((err) => {
  console.error(err);
  process.exit(1);
});
