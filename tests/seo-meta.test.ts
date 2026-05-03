/**
 * SEO Meta Tag Tests — Live Production Site
 *
 * Fetches real pages from https://chavrutai.com/ with a Googlebot user-agent
 * (which triggers the server-side meta injection in servePageWithMeta) and asserts:
 *   1. Every page has a non-empty <title> and og:title
 *   2. <title> ends with "| ChavrutAI"
 *   3. <title> is NOT the generic homepage default for non-homepage pages
 *   4. <title> contains page-specific expected keywords
 *   5. No raw HTML entities (&amp; &quot; &lt; &gt;) in title or og:title text
 *   6. All page titles are unique (no two pages share the same title)
 *
 * Run: npx vitest run tests/seo-meta.test.ts
 *
 * Note: These are integration tests against the live site. They require internet
 * access and may be slow (~20-40s for the full suite). Set SKIP_LIVE_SEO_TESTS=1
 * to skip if running offline.
 */

import { describe, it, expect, beforeAll } from 'vitest';

const BASE_URL = process.env.SEO_TEST_BASE_URL ?? 'https://chavrutai.com';
const CRAWLER_UA = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
const FETCH_TIMEOUT_MS = 20_000;
const SUITE_TIMEOUT_MS = 120_000;

const GENERIC_TITLE = 'Study Talmud Online - Free Digital Platform | ChavrutAI';
const HTML_ENTITY_PATTERN = /&(?:amp|quot|lt|gt|apos);/i;

interface PageMeta {
  path: string;
  label: string;
  title: string;
  ogTitle: string;
  description: string;
  statusCode: number;
  error?: string;
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&apos;/g, "'");
}

function extractTitle(html: string): string {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? decodeHtmlEntities(m[1].trim()) : '';
}

function extractMetaContent(html: string, property: string, attr: 'property' | 'name'): string {
  const a = attr === 'property' ? 'property' : 'name';
  const r1 = new RegExp(`<meta\\s+${a}="${property}"[^>]*content="([^"]*)"`, 'i');
  const r2 = new RegExp(`<meta\\s+content="([^"]*)"[^>]*${a}="${property}"`, 'i');
  const m = html.match(r1) || html.match(r2);
  return m ? decodeHtmlEntities(m[1].trim()) : '';
}

async function fetchMeta(path: string, label: string): Promise<PageMeta> {
  const url = `${BASE_URL}${path}`;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': CRAWLER_UA },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      redirect: 'follow',
    });
    const html = await res.text();
    return {
      path,
      label,
      title: extractTitle(html),
      ogTitle: extractMetaContent(html, 'og:title', 'property'),
      description: extractMetaContent(html, 'description', 'name'),
      statusCode: res.status,
    };
  } catch (err: any) {
    return { path, label, title: '', ogTitle: '', description: '', statusCode: 0, error: String(err) };
  }
}

interface PageSpec {
  path: string;
  label: string;
  expectedInTitle: string[];
  isHomepage?: boolean;
}

const PAGE_SPECS: PageSpec[] = [
  // ── Footer: Library ──────────────────────────────────────────────────────
  { path: '/',            label: 'Homepage',             expectedInTitle: ['Talmud', 'ChavrutAI'], isHomepage: true },
  { path: '/talmud',      label: 'Talmud index',         expectedInTitle: ['Talmud', 'ChavrutAI'] },
  { path: '/bible',       label: 'Bible index',          expectedInTitle: ['Bible', 'ChavrutAI'] },
  { path: '/mishnah',     label: 'Mishnah index',        expectedInTitle: ['Mishnah', 'ChavrutAI'] },
  { path: '/yerushalmi',  label: 'Jerusalem Talmud',     expectedInTitle: ['Jerusalem', 'ChavrutAI'] },
  { path: '/rambam',      label: 'Mishneh Torah',        expectedInTitle: ['Rambam', 'ChavrutAI'] },

  // ── Footer: Study Resources ───────────────────────────────────────────────
  { path: '/sugya-viewer',    label: 'Sugya Viewer',         expectedInTitle: ['Sugya', 'ChavrutAI'] },
  { path: '/suggested-pages', label: 'Suggested Pages',      expectedInTitle: ['Talmud', 'ChavrutAI'] },
  { path: '/biblical-index',  label: 'Biblical Index',       expectedInTitle: ['Biblical', 'ChavrutAI'] },
  { path: '/mishnah-map',     label: 'Mishnah-Talmud Map',   expectedInTitle: ['Mishnah', 'ChavrutAI'] },
  { path: '/blog-posts',      label: 'Blog Posts',           expectedInTitle: ['Blog', 'ChavrutAI'] },
  { path: '/jastrow',         label: 'Jastrow Dictionary',   expectedInTitle: ['Jastrow', 'ChavrutAI'] },
  { path: '/bdb',             label: 'BDB Dictionary',       expectedInTitle: ['BDB', 'ChavrutAI'] },
  { path: '/term-index',      label: 'Term Index',           expectedInTitle: ['ChavrutAI'] },
  { path: '/search',          label: 'Search',               expectedInTitle: ['Search', 'ChavrutAI'] },

  // ── Footer: About & Legal ─────────────────────────────────────────────────
  { path: '/about',      label: 'About',     expectedInTitle: ['About', 'ChavrutAI'] },
  { path: '/sitemap',    label: 'Sitemap',   expectedInTitle: ['ChavrutAI'] },
  { path: '/contact',    label: 'Contact',   expectedInTitle: ['Contact', 'ChavrutAI'] },
  { path: '/privacy',    label: 'Privacy',   expectedInTitle: ['Privacy', 'ChavrutAI'] },
  { path: '/changelog',  label: 'Changelog', expectedInTitle: ['Changelog', 'ChavrutAI'] },

  // ── Talmud subpages ───────────────────────────────────────────────────────
  { path: '/talmud/berakhot',     label: 'Berakhot tractate',   expectedInTitle: ['Berakhot', 'ChavrutAI'] },
  { path: '/talmud/berakhot/2a',  label: 'Berakhot 2A',         expectedInTitle: ['Berakhot', '2A', 'ChavrutAI'] },
  { path: '/talmud/shabbat/10b',  label: 'Shabbat 10B',         expectedInTitle: ['Shabbat', '10B', 'ChavrutAI'] },
  { path: '/talmud/sanhedrin/37a',label: 'Sanhedrin 37A',        expectedInTitle: ['Sanhedrin', '37A', 'ChavrutAI'] },

  // ── Bible subpages ────────────────────────────────────────────────────────
  { path: '/bible/Genesis',     label: 'Genesis book',       expectedInTitle: ['Genesis', 'ChavrutAI'] },
  { path: '/bible/Genesis/1',   label: 'Genesis chapter 1',  expectedInTitle: ['Genesis', 'ChavrutAI'] },
  { path: '/bible/Psalms/119',  label: 'Psalms chapter 119', expectedInTitle: ['Psalms', '119', 'ChavrutAI'] },

  // ── Mishnah subpages ──────────────────────────────────────────────────────
  { path: '/mishnah/berakhot',    label: 'Mishnah Berakhot',     expectedInTitle: ['Mishnah', 'Berakhot', 'ChavrutAI'] },
  { path: '/mishnah/berakhot/1',  label: 'Mishnah Berakhot ch.1',expectedInTitle: ['Mishnah', 'Berakhot', 'ChavrutAI'] },

  // ── Yerushalmi subpages ───────────────────────────────────────────────────
  { path: '/yerushalmi/berakhot',      label: 'Yerushalmi Berakhot',     expectedInTitle: ['Berakhot', 'ChavrutAI'] },
  { path: '/yerushalmi/berakhot/1.1',  label: 'Yerushalmi Berakhot 1:1', expectedInTitle: ['Berakhot', 'ChavrutAI'] },

  // ── Rambam subpages ───────────────────────────────────────────────────────
  { path: '/rambam/Repentance',    label: 'Rambam Repentance',     expectedInTitle: ['Repentance', 'ChavrutAI'] },
  { path: '/rambam/Repentance/1',  label: 'Rambam Repentance ch.1',expectedInTitle: ['Repentance', 'ChavrutAI'] },

  // ── Query-param pages ─────────────────────────────────────────────────────
  // letter param — title must differ from the base /jastrow title
  { path: '/jastrow?letter=%D7%90', label: 'Jastrow letter aleph', expectedInTitle: ['Jastrow', 'ChavrutAI'] },
  { path: '/bdb?letter=aleph',      label: 'BDB letter aleph',     expectedInTitle: ['BDB', 'ChavrutAI'] },
  // search query — title must contain the query term
  { path: '/search?q=shabbat', label: 'Search: shabbat', expectedInTitle: ['shabbat', 'ChavrutAI'] },
];

const metaCache = new Map<string, PageMeta>();

describe('SEO Meta Tags — Live Production (chavrutai.com)', () => {

  beforeAll(async () => {
    if (process.env.SKIP_LIVE_SEO_TESTS === '1') return;

    const fetches = PAGE_SPECS.map(spec => fetchMeta(spec.path, spec.label));
    const results = await Promise.all(fetches);
    for (const r of results) {
      metaCache.set(r.path, r);
    }
  }, SUITE_TIMEOUT_MS);

  function getMeta(spec: PageSpec): PageMeta {
    const m = metaCache.get(spec.path);
    if (!m) throw new Error(`No data fetched for ${spec.path}`);
    return m;
  }

  // ── Individual page assertions ──────────────────────────────────────────

  for (const spec of PAGE_SPECS) {
    describe(`${spec.label} (${spec.path})`, () => {

      it('fetched successfully (HTTP 2xx)', () => {
        if (process.env.SKIP_LIVE_SEO_TESTS === '1') return;
        const meta = getMeta(spec);
        if (meta.error) throw new Error(`Fetch error: ${meta.error}`);
        expect(meta.statusCode, `Expected 2xx for ${spec.path}`).toBeGreaterThanOrEqual(200);
        expect(meta.statusCode, `Expected 2xx for ${spec.path}`).toBeLessThan(300);
      });

      it('<title> is non-empty', () => {
        if (process.env.SKIP_LIVE_SEO_TESTS === '1') return;
        const { title } = getMeta(spec);
        expect(title, `<title> is empty for ${spec.path}`).toBeTruthy();
      });

      it('<title> ends with "| ChavrutAI"', () => {
        if (process.env.SKIP_LIVE_SEO_TESTS === '1') return;
        const { title } = getMeta(spec);
        expect(title, `<title> missing "| ChavrutAI" for ${spec.path}`).toMatch(/\| ChavrutAI$/);
      });

      it('<title> is not the generic homepage default', () => {
        if (process.env.SKIP_LIVE_SEO_TESTS === '1') return;
        if (spec.isHomepage) return;
        const { title } = getMeta(spec);
        expect(title, `<title> is generic default for ${spec.path}`).not.toBe(GENERIC_TITLE);
      });

      it('<title> contains all expected keywords', () => {
        if (process.env.SKIP_LIVE_SEO_TESTS === '1') return;
        const { title } = getMeta(spec);
        for (const kw of spec.expectedInTitle) {
          expect(
            title.toLowerCase(),
            `<title> missing keyword "${kw}" for ${spec.path} — got: "${title}"`
          ).toContain(kw.toLowerCase());
        }
      });

      it('<title> contains no raw HTML entities', () => {
        if (process.env.SKIP_LIVE_SEO_TESTS === '1') return;
        const { title } = getMeta(spec);
        expect(
          title,
          `<title> contains raw HTML entity for ${spec.path} — got: "${title}"`
        ).not.toMatch(HTML_ENTITY_PATTERN);
      });

      it('og:title is non-empty', () => {
        if (process.env.SKIP_LIVE_SEO_TESTS === '1') return;
        const { ogTitle } = getMeta(spec);
        expect(ogTitle, `og:title is empty for ${spec.path}`).toBeTruthy();
      });

      it('og:title contains no raw HTML entities', () => {
        if (process.env.SKIP_LIVE_SEO_TESTS === '1') return;
        const { ogTitle } = getMeta(spec);
        expect(
          ogTitle,
          `og:title contains raw HTML entity for ${spec.path} — got: "${ogTitle}"`
        ).not.toMatch(HTML_ENTITY_PATTERN);
      });

      it('meta description is non-empty', () => {
        if (process.env.SKIP_LIVE_SEO_TESTS === '1') return;
        const { description } = getMeta(spec);
        expect(description, `meta description is empty for ${spec.path}`).toBeTruthy();
      });
    });
  }

  // ── Cross-page uniqueness ────────────────────────────────────────────────

  describe('Cross-page uniqueness', () => {

    it('all page <title> tags are unique', () => {
      if (process.env.SKIP_LIVE_SEO_TESTS === '1') return;
      const titles: string[] = [];
      const duplicates: string[] = [];

      for (const spec of PAGE_SPECS) {
        const meta = metaCache.get(spec.path);
        if (!meta || !meta.title) continue;
        if (titles.includes(meta.title)) {
          duplicates.push(`Duplicate <title> "${meta.title}" — found on ${spec.path}`);
        }
        titles.push(meta.title);
      }

      expect(duplicates, duplicates.join('\n')).toHaveLength(0);
    });

    it('all og:title values are unique', () => {
      if (process.env.SKIP_LIVE_SEO_TESTS === '1') return;
      const ogTitles: string[] = [];
      const duplicates: string[] = [];

      for (const spec of PAGE_SPECS) {
        const meta = metaCache.get(spec.path);
        if (!meta || !meta.ogTitle) continue;
        if (ogTitles.includes(meta.ogTitle)) {
          duplicates.push(`Duplicate og:title "${meta.ogTitle}" — found on ${spec.path}`);
        }
        ogTitles.push(meta.ogTitle);
      }

      expect(duplicates, duplicates.join('\n')).toHaveLength(0);
    });

    it('no non-homepage page uses the generic homepage title', () => {
      if (process.env.SKIP_LIVE_SEO_TESTS === '1') return;
      const violations: string[] = [];

      for (const spec of PAGE_SPECS) {
        if (spec.isHomepage) continue;
        const meta = metaCache.get(spec.path);
        if (meta && meta.title === GENERIC_TITLE) {
          violations.push(`${spec.path} — "${meta.title}"`);
        }
      }

      expect(violations, `These pages use the generic homepage title:\n${violations.join('\n')}`).toHaveLength(0);
    });

    it('query-param pages have different title from their base page', () => {
      if (process.env.SKIP_LIVE_SEO_TESTS === '1') return;

      const paramPages: Array<{ paramPath: string; basePath: string }> = [
        { paramPath: '/jastrow?letter=%D7%90', basePath: '/jastrow' },
        { paramPath: '/bdb?letter=aleph',      basePath: '/bdb' },
        { paramPath: '/search?q=shabbat',      basePath: '/search' },
      ];

      for (const { paramPath, basePath } of paramPages) {
        const paramMeta = metaCache.get(paramPath);
        const baseMeta  = metaCache.get(basePath);
        if (!paramMeta?.title || !baseMeta?.title) continue;

        expect(
          paramMeta.title,
          `"${paramPath}" has same title as base "${basePath}": "${paramMeta.title}"`
        ).not.toBe(baseMeta.title);
      }
    });
  });

  // ── Summary helper (logs a table when run with --reporter=verbose) ───────

  describe('Summary', () => {
    it('prints title/og:title for all pages', () => {
      if (process.env.SKIP_LIVE_SEO_TESTS === '1') return;
      const rows = PAGE_SPECS.map(spec => {
        const m = metaCache.get(spec.path);
        return {
          path: spec.path,
          title: m?.title || '(missing)',
          ogTitle: m?.ogTitle || '(missing)',
          status: m?.statusCode ?? 0,
        };
      });
      console.table(rows);
      expect(true).toBe(true);
    });
  });
});
