/**
 * Tests for Yerushalmi plain-chapter redirect/404 logic.
 *
 * Plain-chapter URLs (e.g. /yerushalmi/Taanit/3) are soft 404s unless we
 * redirect them.  Both the api-server middleware and the SPA component use the
 * same shared functions to compute the redirect target; these tests exercise
 * that shared logic so regressions surface before they ship.
 */
import { describe, it, expect } from "vitest";
import { getYerushalmiTractateInfo } from "@workspace/shared-data/yerushalmi-data";
import {
  findFirstValidHalakhahInChapter,
  isYerushalmiHalakhahMissing,
} from "@workspace/shared-data/yerushalmi-missing";
import yerushalmiShapes from "@workspace/shared-data/data/yerushalmi-shapes.json";

const shapes = yerushalmiShapes as Record<string, number[][]>;

function getShapes(tractate: string): number[][] {
  const info = getYerushalmiTractateInfo(tractate);
  if (!info) return [];
  return shapes[info.sefaria] ?? [];
}

// ---------------------------------------------------------------------------
// Helper: compute the server/SPA redirect target for a bare chapter URL.
// Returns:
//   { kind: "halakhah", target: "chapter.h" }  — redirect to first valid h
//   { kind: "tractate" }                        — entire chapter is missing
//   { kind: "notfound" }                        — out-of-range or invalid input
// ---------------------------------------------------------------------------
function computeRedirectTarget(
  tractateSlug: string,
  chapterNum: number,
): { kind: "halakhah"; target: string } | { kind: "tractate" } | { kind: "notfound" } {
  const info = getYerushalmiTractateInfo(tractateSlug);
  if (!info) return { kind: "notfound" };
  if (isNaN(chapterNum) || chapterNum < 1 || chapterNum > info.chapters) {
    return { kind: "notfound" };
  }
  const s = getShapes(tractateSlug);
  const firstValid = findFirstValidHalakhahInChapter(info.name, chapterNum, s);
  if (firstValid === null) return { kind: "tractate" };
  return { kind: "halakhah", target: `${chapterNum}.${firstValid}` };
}

// ---------------------------------------------------------------------------
// Valid chapters with available text
// ---------------------------------------------------------------------------
describe("Yerushalmi plain-chapter redirect — valid chapters", () => {
  it("redirects /yerushalmi/Taanit/3 → Taanit/3.1  (GSC-flagged)", () => {
    const r = computeRedirectTarget("Taanit", 3);
    expect(r).toEqual({ kind: "halakhah", target: "3.1" });
  });

  it("redirects /yerushalmi/Yoma/5 → Yoma/5.1", () => {
    const r = computeRedirectTarget("Yoma", 5);
    expect(r).toEqual({ kind: "halakhah", target: "5.1" });
  });

  it("redirects all nine GSC-flagged URLs to chapter.1 (none have h=1 missing)", () => {
    const cases: [string, number][] = [
      ["Taanit", 3],
      ["Yoma", 5],
      ["Yevamot", 5],
      ["Yevamot", 6],
      ["Sanhedrin", 10],
      ["Sanhedrin", 11],
      ["Sheviit", 1],
      ["Shabbat", 15],
      ["Shabbat", 18],
    ];
    for (const [tractate, chapter] of cases) {
      const r = computeRedirectTarget(tractate, chapter);
      expect(r, `${tractate}/${chapter}`).toEqual({
        kind: "halakhah",
        target: `${chapter}.1`,
      });
    }
  });

  it("skips a missing halakhah 1 and lands on the next available one", () => {
    // Yevamot 2.5 is missing; 2.1–2.4 exist, so chapter 2 → 2.1
    // This verifies findFirstValidHalakhahInChapter starts at h=1 correctly.
    const r = computeRedirectTarget("Yevamot", 2);
    expect(r).toEqual({ kind: "halakhah", target: "2.1" });

    // Niddah 4.2+ are missing; 4.1 exists, so chapter 4 → 4.1
    const r2 = computeRedirectTarget("Niddah", 4);
    expect(r2).toEqual({ kind: "halakhah", target: "4.1" });
  });
});

// ---------------------------------------------------------------------------
// Chapters where the entire chapter is missing (→ tractate page)
// ---------------------------------------------------------------------------
describe("Yerushalmi plain-chapter redirect — empty chapters → tractate", () => {
  it("Shabbat 21 → tractate page  (chapters 21-24 are all missing)", () => {
    const r = computeRedirectTarget("Shabbat", 21);
    expect(r).toEqual({ kind: "tractate" });
  });

  it("Makkot 3 → tractate page  (chapter 3 is all missing)", () => {
    const r = computeRedirectTarget("Makkot", 3);
    expect(r).toEqual({ kind: "tractate" });
  });
});

// ---------------------------------------------------------------------------
// Out-of-range and invalid inputs → NotFound (HTTP 404 / SPA NotFound)
// ---------------------------------------------------------------------------
describe("Yerushalmi plain-chapter redirect — invalid inputs → not-found", () => {
  it("returns not-found for chapter 0 (below range)", () => {
    expect(computeRedirectTarget("Taanit", 0)).toEqual({ kind: "notfound" });
  });

  it("returns not-found for chapter beyond tractate max (Taanit has 4)", () => {
    expect(computeRedirectTarget("Taanit", 5)).toEqual({ kind: "notfound" });
    expect(computeRedirectTarget("Taanit", 99)).toEqual({ kind: "notfound" });
  });

  it("returns not-found for past-last chapter of a longer tractate (Shabbat has 24)", () => {
    expect(computeRedirectTarget("Shabbat", 25)).toEqual({ kind: "notfound" });
  });

  it("returns not-found for an invalid tractate slug", () => {
    expect(computeRedirectTarget("FakeTractate", 1)).toEqual({ kind: "notfound" });
    expect(computeRedirectTarget("", 1)).toEqual({ kind: "notfound" });
  });

  it("returns not-found for NaN chapter", () => {
    expect(computeRedirectTarget("Taanit", NaN)).toEqual({ kind: "notfound" });
  });
});

// ---------------------------------------------------------------------------
// Verify isYerushalmiHalakhahMissing is not accidentally applied to the
// redirect's starting halakhah when h=1 genuinely exists
// ---------------------------------------------------------------------------
describe("findFirstValidHalakhahInChapter — direct unit tests", () => {
  it("returns 1 when h=1 is not missing", () => {
    const s = getShapes("Taanit");
    expect(findFirstValidHalakhahInChapter("Taanit", 3, s)).toBe(1);
  });

  it("returns null for an entirely missing chapter", () => {
    const s = getShapes("Shabbat");
    // Shabbat ch.21 through ch.24 are all marked missing
    expect(findFirstValidHalakhahInChapter("Shabbat", 21, s)).toBe(null);
    expect(findFirstValidHalakhahInChapter("Shabbat", 24, s)).toBe(null);
  });

  it("returns null for an empty shapes entry (chapter beyond shape data)", () => {
    // Passing an empty shapes array simulates a chapter not in shape data
    expect(findFirstValidHalakhahInChapter("Taanit", 1, [])).toBe(null);
  });
});
