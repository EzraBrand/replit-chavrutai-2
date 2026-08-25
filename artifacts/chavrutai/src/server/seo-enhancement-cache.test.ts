import { describe, expect, it, vi } from "vitest";
import {
  normalizeSeoEnhancementKey,
  SeoEnhancementCache,
} from "./seo-enhancement-cache";

describe("normalizeSeoEnhancementKey", () => {
  it("normalizes path spelling and removes irrelevant query parameters", () => {
    expect(
      normalizeSeoEnhancementKey("/talmud//Berakhot/2a/?utm_source=bot"),
    ).toBe("/talmud/Berakhot/2a");
  });

  it("retains only query parameters that affect crawler metadata", () => {
    expect(
      normalizeSeoEnhancementKey("/search?type=talmud&utm_source=bot&q=shabbat"),
    ).toBe("/search?q=shabbat&type=talmud");
    expect(normalizeSeoEnhancementKey("/bdb?q=abc&letter=%D7%90&ref=x")).toBe(
      "/bdb?letter=%D7%90&q=abc",
    );
  });
});

describe("SeoEnhancementCache", () => {
  it("coalesces concurrent loads and reuses successful results", async () => {
    let resolveLoad!: (value: string) => void;
    const loader = vi.fn(
      () => new Promise<string>((resolve) => {
        resolveLoad = resolve;
      }),
    );
    const cache = new SeoEnhancementCache<string>(2, 1_000);

    const first = cache.load("/talmud/Berakhot/2a", loader);
    const second = cache.load("/talmud/Berakhot/2a", loader);
    expect(first.outcome).toBe("miss");
    expect(second.outcome).toBe("coalesced");
    expect(loader).toHaveBeenCalledTimes(1);

    resolveLoad("enhancement");
    await expect(Promise.all([first.value, second.value])).resolves.toEqual([
      "enhancement",
      "enhancement",
    ]);
    const third = cache.load("/talmud/Berakhot/2a", loader);
    expect(third.outcome).toBe("hit");
    await expect(third.value).resolves.toBe("enhancement");
  });

  it("expires entries, evicts least-recently-used entries, and retries failures", async () => {
    vi.useFakeTimers();
    try {
      const cache = new SeoEnhancementCache<string>(2, 100);
      await cache.load("a", async () => "A").value;
      await cache.load("b", async () => "B").value;
      expect(cache.load("a", async () => "new A").outcome).toBe("hit");
      await cache.load("c", async () => "C").value;
      expect(cache.load("b", async () => "new B").outcome).toBe("miss");

      await expect(
        cache.load("failure", async () => {
          throw new Error("upstream failed");
        }).value,
      ).rejects.toThrow("upstream failed");
      expect(cache.load("failure", async () => "recovered").outcome).toBe("miss");

      vi.advanceTimersByTime(101);
      expect(cache.load("a", async () => "expired A").outcome).toBe("miss");
    } finally {
      vi.useRealTimers();
    }
  });
});
