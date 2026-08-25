export type AsyncCacheOutcome = "hit" | "miss" | "coalesced";

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class AsyncTtlLruCache<T> {
  private readonly entries = new Map<string, CacheEntry<T>>();
  private readonly inFlight = new Map<string, Promise<T>>();

  constructor(
    private readonly maxEntries: number,
    private readonly ttlMs: number,
  ) {
    if (!Number.isInteger(maxEntries) || maxEntries < 1) {
      throw new Error("maxEntries must be a positive integer");
    }
    if (!Number.isFinite(ttlMs) || ttlMs <= 0) {
      throw new Error("ttlMs must be positive");
    }
  }

  get(key: string): T | undefined {
    const entry = this.entries.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt <= Date.now()) {
      this.entries.delete(key);
      return undefined;
    }

    this.entries.delete(key);
    this.entries.set(key, entry);
    return entry.value;
  }

  set(key: string, value: T): void {
    this.entries.delete(key);
    this.entries.set(key, { value, expiresAt: Date.now() + this.ttlMs });
    while (this.entries.size > this.maxEntries) {
      const oldestKey = this.entries.keys().next().value;
      if (oldestKey === undefined) break;
      this.entries.delete(oldestKey);
    }
  }

  values(): T[] {
    const values: T[] = [];
    for (const key of [...this.entries.keys()]) {
      const value = this.get(key);
      if (value !== undefined) values.push(value);
    }
    return values;
  }

  load(
    key: string,
    loader: () => Promise<T>,
  ): { outcome: AsyncCacheOutcome; value: Promise<T> } {
    const cached = this.get(key);
    if (cached !== undefined) {
      return { outcome: "hit", value: Promise.resolve(cached) };
    }

    const pending = this.inFlight.get(key);
    if (pending) {
      return { outcome: "coalesced", value: pending };
    }

    const value = loader()
      .then((loaded) => {
        this.set(key, loaded);
        return loaded;
      })
      .finally(() => {
        this.inFlight.delete(key);
      });
    this.inFlight.set(key, value);
    return { outcome: "miss", value };
  }
}