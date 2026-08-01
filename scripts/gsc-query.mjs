#!/usr/bin/env node
// Query Google Search Console via service account (GOOGLE_SEARCH_CONSOLE_KEY secret).
// Usage:
//   node scripts/gsc-query.mjs sites
//   node scripts/gsc-query.mjs sitemaps [siteUrl]
//   node scripts/gsc-query.mjs analytics [siteUrl] [days]
import crypto from "node:crypto";

const key = JSON.parse(process.env.GOOGLE_SEARCH_CONSOLE_KEY || "{}");
if (!key.client_email) {
  console.error("GOOGLE_SEARCH_CONSOLE_KEY secret missing or invalid");
  process.exit(1);
}

const b64url = (buf) => Buffer.from(buf).toString("base64url");

async function getToken() {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = b64url(
    JSON.stringify({
      iss: key.client_email,
      scope: "https://www.googleapis.com/auth/webmasters.readonly",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    }),
  );
  const input = `${header}.${claims}`;
  const signature = crypto.sign("RSA-SHA256", Buffer.from(input), key.private_key);
  const jwt = `${input}.${b64url(signature)}`;
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error("token error: " + JSON.stringify(data));
  return data.access_token;
}

async function api(path, opts = {}) {
  const token = await getToken();
  const res = await fetch(`https://www.googleapis.com/webmasters/v3${path}`, {
    ...opts,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(opts.headers || {}) },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status} ${text}`);
  return text ? JSON.parse(text) : null;
}

const [cmd = "sites", siteArg, daysArg] = process.argv.slice(2);
const site = encodeURIComponent(siteArg || "sc-domain:bekiut.com");

if (cmd === "sites") {
  console.log(JSON.stringify(await api("/sites"), null, 2));
} else if (cmd === "sitemaps") {
  console.log(JSON.stringify(await api(`/sites/${site}/sitemaps`), null, 2));
} else if (cmd === "analytics") {
  const days = Number(daysArg || 28);
  const end = new Date().toISOString().slice(0, 10);
  const start = new Date(Date.now() - days * 864e5).toISOString().slice(0, 10);
  const body = JSON.stringify({
    startDate: start,
    endDate: end,
    dimensions: ["query"],
    rowLimit: 25,
  });
  console.log(JSON.stringify(await api(`/sites/${site}/searchAnalytics/query`, { method: "POST", body }), null, 2));
} else {
  console.error("unknown command:", cmd);
  process.exit(1);
}
