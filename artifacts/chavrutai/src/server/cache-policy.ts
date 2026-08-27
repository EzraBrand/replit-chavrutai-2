import path from "node:path";

export const CACHE_CONTROL = {
  immutable: "public, max-age=31536000, immutable",
  publicData: "public, max-age=3600, must-revalidate",
  stableAsset: "public, max-age=86400, must-revalidate",
  revalidate: "no-cache",
} as const;

const HASHED_ASSET_RE =
  /(?:^|[/\\])assets[/\\].+-[A-Za-z0-9_-]{8,}\.(?:js|mjs|css|map|png|jpe?g|gif|svg|webp|ico|woff2?|ttf|eot)$/i;
const STABLE_ASSET_RE =
  /\.(?:png|jpe?g|gif|svg|webp|ico|webmanifest|woff2?|ttf|eot|txt|xml)$/i;

export function cacheControlForStaticFile(filePath: string): string {
  if (HASHED_ASSET_RE.test(filePath)) return CACHE_CONTROL.immutable;

  const extension = path.extname(filePath).toLowerCase();
  if (extension === ".json") return CACHE_CONTROL.publicData;
  if (extension === ".html" || path.basename(filePath) === "sw.js") {
    return CACHE_CONTROL.revalidate;
  }
  if (STABLE_ASSET_RE.test(filePath)) return CACHE_CONTROL.stableAsset;

  return CACHE_CONTROL.revalidate;
}