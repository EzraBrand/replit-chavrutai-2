import { mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getTalmudShareDescription, renderTalmudExcerptHtml, TalmudExcerptLoader } from "./talmud-excerpts";

const dirs: string[] = [];
const fixture = {
  schemaVersion: 1,
  tractate: "Berakhot",
  source: {
    englishVersion: "William Davidson Edition",
    hebrewVersion: "Vilna Edition",
    license: "CC BY-NC 3.0",
    englishUrl: "https://www.sefaria.org/Berakhot.2a?lang=en",
    hebrewUrl: "https://www.sefaria.org/Berakhot.2a?lang=he",
    generatedAt: "2026-01-01T00:00:00.000Z",
    englishLicense: "CC-BY-NC",
    hebrewLicense: "CC-BY-NC",
    provenance: {
      englishVersionSource: "https://korenpub.com/collections/the-noe-edition-koren-talmud-bavli-1",
      hebrewVersionSource: "https://korenpub.co.il/collections/the-noe-edition-koren-talmud-bavli-1",
    },
  },
  pages: {
    "2a": {
      ref: "Berakhot 2a",
      sections: [{
        ref: "Berakhot 2a:1",
        english: "<strong>Gemara:</strong> From when & why?",
        hebrew: "מֵאֵימָתַי <script>alert(1)</script>",
      }],
    },
  },
};

afterEach(async () => {
  const { rm } = await import("node:fs/promises");
  await Promise.all(dirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

async function makeFixture(): Promise<string> {
  const dir = await mkdtemp(path.join(os.tmpdir(), "talmud-excerpts-"));
  dirs.push(dir);
  await writeFile(path.join(dir, "Berakhot.json"), JSON.stringify(fixture));
  return dir;
}

describe("Talmud sharing descriptions", () => {
  const description = (english: string) => getTalmudShareDescription({
    source: fixture.source,
    page: { ref: "Berakhot 2a", sections: [{ ref: "Berakhot 2a:1", english, hebrew: "טקסט" }] },
  });

  it("uses a complete opening sentence with reader terminology and no markup", () => {
    expect(description("Rabbi <b>Meir</b> taught this. A later sentence."))
      .toBe("R' Meir taught this.");
    expect(description('He said “Go!” Then he left.')).toBe('He said “Go!”');
  });

  it("caps long previews at 200 characters and a word boundary", () => {
    const text = description("Opening " + "passage ".repeat(80));
    expect(text!.length).toBeLessThanOrEqual(200);
    expect(text).toMatch(/passage…$/);
  });

  it("keeps short text and safely signals missing text", () => {
    expect(description("  Short   passage  ")).toBe("Short passage");
    expect(description(" <b> </b> ")).toBeNull();
    expect(getTalmudShareDescription({
      source: fixture.source, page: { ref: "Berakhot 2a", sections: [] },
    })).toBeNull();
  });
});

describe("TalmudExcerptLoader", () => {
  it("cold-loads then serves warm reads from its tractate cache", async () => {
    const dir = await makeFixture();
    const read = vi.fn(async (filePath: string) => await (await import("node:fs/promises")).readFile(filePath, "utf8"));
    const loader = new TalmudExcerptLoader(dir, { error: vi.fn() }, read);
    await expect(loader.get("Berakhot", "2a")).resolves.toMatchObject({
      page: { ref: "Berakhot 2a", sections: [{ ref: "Berakhot 2a:1" }] },
      source: { license: "CC BY-NC 3.0" },
    });
    await loader.get("Berakhot", "2a");
    expect(read).toHaveBeenCalledTimes(1);
  });

  it("rejects noncanonical slugs, traversal, and invalid folios before reading", async () => {
    const read = vi.fn();
    const log = { error: vi.fn() };
    const loader = new TalmudExcerptLoader("/unreachable", log, read);
    await expect(loader.get("../Berakhot", "2a")).resolves.toBeNull();
    await expect(loader.get("berakhot", "2a")).resolves.toBeNull();
    await expect(loader.get("Berakhot", "../../2a")).resolves.toBeNull();
    await expect(loader.get("Berakhot", "999a")).resolves.toBeNull();
    expect(read).not.toHaveBeenCalled();
    expect(log.error).toHaveBeenCalled();
  });

  it.each([
    ["Berakhot", "10a"],
    ["Berakhot", "19b"],
    ["Shabbat", "100a"],
    ["Shabbat", "157b"],
    ["Tamid", "25b"],
  ])("accepts the full valid folio range for %s %s", async (tractate, folio) => {
    const dir = await makeFixture();
    const ref = `${tractate} ${folio}`;
    await writeFile(path.join(dir, `${tractate}.json`), JSON.stringify({
      ...fixture,
      tractate,
      pages: {
        [folio]: {
          ref,
          sections: [{ ref: `${ref}:1`, english: "A complete passage.", hebrew: "קטע שלם" }],
        },
      },
    }));
    const loader = new TalmudExcerptLoader(dir, { error: vi.fn() });
    await expect(loader.get(tractate, folio)).resolves.toMatchObject({ page: { ref } });
  });

  it("does not retain missing-file failures in the warm cache", async () => {
    const dir = await makeFixture();
    const read = vi.fn()
      .mockRejectedValueOnce(new Error("temporarily missing"))
      .mockImplementation(async (filePath: string) => await (await import("node:fs/promises")).readFile(filePath, "utf8"));
    const loader = new TalmudExcerptLoader(dir, { error: vi.fn() }, read);
    await expect(loader.get("Berakhot", "2a")).resolves.toBeNull();
    await expect(loader.get("Berakhot", "2a")).resolves.toMatchObject({ page: { ref: "Berakhot 2a" } });
    expect(read).toHaveBeenCalledTimes(2);
  });

  it.each([
    ["wrong page ref", (value: any) => { value.pages["2a"].ref = "Berakhot 2b"; }],
    ["non-sequential section ref", (value: any) => { value.pages["2a"].sections[0].ref = "Berakhot 2a:2"; }],
    ["replacement character", (value: any) => { value.pages["2a"].sections[0].english = "bad \uFFFD text"; }],
    ["too many sections", (value: any) => {
      value.pages["2a"].sections = Array.from({ length: 6 }, (_, index) => ({
        ref: `Berakhot 2a:${index + 1}`, english: "English text", hebrew: "טקסט עברי",
      }));
    }],
  ])("rejects a corrupt generated asset: %s", async (_label, corrupt) => {
    const dir = await makeFixture();
    const corruptFixture = structuredClone(fixture);
    corrupt(corruptFixture);
    await writeFile(path.join(dir, "Berakhot.json"), JSON.stringify(corruptFixture));
    const loader = new TalmudExcerptLoader(dir, { error: vi.fn() });
    await expect(loader.get("Berakhot", "2a")).resolves.toBeNull();
  });

  it("renders authentic refs, escaped bilingual text, reader terms, and attribution", async () => {
    const loader = new TalmudExcerptLoader(await makeFixture(), { error: vi.fn() });
    const excerpt = await loader.get("Berakhot", "2a");
    expect(excerpt).not.toBeNull();
    const html = renderTalmudExcerptHtml(excerpt!);
    expect(html).toContain('data-ref="Berakhot 2a:1"');
    expect(html).toContain('lang="he" dir="rtl"');
    expect(html).toContain("מאימתי");
    expect(html).not.toMatch(/[\u0591-\u05bd\u05bf-\u05c7]/);
    expect(html).toContain('lang="en" dir="ltr"');
    expect(html).toContain("Talmud:");
    expect(html).toContain("&amp; why?");
    expect(html).not.toContain("<script>");
    expect(html).toContain("CC BY-NC 3.0");
    expect(html).toContain('rel="license"');
    expect(html).toContain("Koren");
    expect(html).toContain('href="https://www.sefaria.org/Berakhot.2a?lang=en"');
  });
});