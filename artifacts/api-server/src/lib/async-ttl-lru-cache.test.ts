import { describe, expect, it, vi } from "vitest";
import { AsyncTtlLruCache } from "./async-ttl-lru-cache";

describe("AsyncTtlLruCache", () => {
  it("coalesces concurrent misses and caches the successful result", async () => {
    let resolveLoad!: (value: string) => void;
    const loader = vi.fn(() => new Promise<string>((resolve) => {
      resolveLoad = resolve;
    }));
    const cache = new AsyncTtlLruCache<string>(2, 1_000);

    const first = cache.load("genesis:1", loader);
    const second = cache.load("genesis:1", loader);

    expect(first.outcome).toBe("miss");
    expect(second.outcome).toBe("coalesced");
    expect(loader).toHaveBeenCalledTimes(1);

    resolveLoad("chapter");
    await expect(Promise.all([first.value, second.value])).resolves.toEqual([
      "chapter",
      "chapter",
    ]);

    const third = cache.load("genesis:1", loader);
    expect(third.outcome).toBe("hit");
    await expect(third.value).resolves.toBe("chapter");
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it("does not cache failed loads", async () => {
    const cache = new AsyncTtlLruCache<string>(2, 1_000);
    const failure = new Error("upstream failed");

    await expect(cache.load("genesis:1", async () => {
      throw failure;
    }).value).rejects.toBe(failure);

    const retry = cache.load("genesis:1", async () => "recovered");
    expect(retry.outcome).toBe("miss");
    await expect(retry.value).resolves.toBe("recovered");
  });

  it("expires old entries and evicts the least recently used entry", () => {
    vi.useFakeTimers();
    try {
      const cache = new AsyncTtlLruCache<string>(2, 100);
      cache.set("a", "A");
      cache.set("b", "B");
      expect(cache.get("a")).toBe("A");
      cache.set("c", "C");

      expect(cache.get("b")).toBeUndefined();
      expect(cache.get("a")).toBe("A");
      vi.advanceTimersByTime(101);
      expect(cache.get("a")).toBeUndefined();
      expect(cache.values()).toEqual([]);
    } finally {
      vi.useRealTimers();
    }
  });
});