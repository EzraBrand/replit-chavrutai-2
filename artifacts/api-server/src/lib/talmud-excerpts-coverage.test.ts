import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { SEDER_TRACTATES, getTractateSlug } from "@workspace/shared-data/tractates";
import { TalmudExcerptLoader } from "./talmud-excerpts";

describe("generated Talmud excerpt runtime coverage", () => {
  it("can actually load every generated page through the production loader", async () => {
    const directory = path.resolve(import.meta.dirname, "../data/talmud-excerpts");
    const manifest = JSON.parse(await readFile(path.join(directory, "manifest.json"), "utf8"));
    const log = { error: vi.fn() };
    const loader = new TalmudExcerptLoader(directory, log);
    let loaded = 0;
    const failures: string[] = [];

    for (const tractate of Object.values(SEDER_TRACTATES).flat()) {
      const slug = getTractateSlug(tractate.name);
      let file: { pages: Record<string, { ref: string }> };
      try {
        file = JSON.parse(await readFile(path.join(directory, `${slug}.json`), "utf8"));
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "ENOENT") continue;
        throw error;
      }
      for (const [folio, expected] of Object.entries(file.pages)) {
        const excerpt = await loader.get(slug, folio);
        if (!excerpt || excerpt.page.ref !== expected.ref) failures.push(`${slug}/${folio}`);
        else loaded++;
      }
    }

    expect(failures, failures.slice(0, 10).join(", ")).toEqual([]);
    expect(loaded).toBe(manifest.pageCount);
    expect(loaded).toBeGreaterThan(0);
    expect(log.error).not.toHaveBeenCalled();
  });
});