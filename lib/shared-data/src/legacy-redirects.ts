import { getTractateSlug } from "./tractates";

// ── Legacy path redirects ────────────────────────────────────────────────────
// Single source of truth for the historical URL scheme, shared by:
//   - the api-server crawler/meta middleware (register-routes.ts)
//   - the chavrutai production web server (src/server/index.ts)
//   - the chavrutai Vite dev-server middleware (vite.config.ts)
// External sites still link to these paths (e.g. Sefaria's "Powered by
// Sefaria" page links to /contents), so all servers must 301 them.
//
// Keep in sync with the legacy entries in route-validation.ts (STATIC_PATHS
// and the /contents/:tractate branch of isKnownAppPath).

/**
 * Returns the canonical replacement path for a legacy pathname, or null when
 * the pathname is not a legacy path. Query strings are the caller's
 * responsibility (append them unchanged to the returned path).
 *
 * Tolerates a single trailing slash ("/contents/" behaves like "/contents").
 */
export function resolveLegacyRedirect(rawPathname: string): string | null {
  let pathname = rawPathname;
  if (pathname.length > 1 && pathname.endsWith("/")) {
    pathname = pathname.slice(0, -1);
  }

  if (pathname === "/contents") return "/talmud";
  if (pathname === "/dictionary") return "/jastrow";

  const contentsTractate = pathname.match(/^\/contents\/([^/]+)$/i);
  if (contentsTractate) {
    return `/talmud/${getTractateSlug(contentsTractate[1])}`;
  }

  return null;
}
