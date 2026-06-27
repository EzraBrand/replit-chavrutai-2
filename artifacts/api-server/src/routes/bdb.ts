import { Router } from "express";
import { storage } from "../storage";
import { searchRequestSchema } from "@workspace/db";

export function createBdbRouter() {
  const router = Router();

  router.get("/api/bdb/search", async (req, res) => {
    try {
      const result = searchRequestSchema.safeParse(req.query);
      if (!result.success) {
        res.status(400).json({ message: "Invalid search query", errors: result.error.issues }); return;
      }
      const entries = await storage.searchBdbEntries(result.data);
      res.json(entries);
    } catch (error) {
      console.error("BDB search error:", error);
      res.status(500).json({ message: "Failed to search BDB entries" });
    }
  });

  // Internal/test: list all single-letter prefix & preposition BDB entries
  // (metadata only — no full text) discovered via Sefaria's v3 texts API.
  // Used by the /bdb-prefix-test page. Text is fetched per-entry on demand.
  router.get("/api/bdb/prefix-probe", async (_req, res) => {
    try {
      const result = await storage.probeBdbPrefixEntries();
      res.json({
        generatedAt: result.generatedAt,
        probed: result.probed,
        found: result.found,
        entries: result.entries.map(({ text, ...meta }) => meta),
      });
    } catch (error) {
      console.error("BDB prefix probe error:", error);
      res.status(500).json({ message: "Failed to probe BDB prefix entries" });
    }
  });

  // Internal/test: fetch a single prefix entry's full text on demand.
  router.get("/api/bdb/prefix-entry", async (req, res) => {
    try {
      const form = typeof req.query.form === "string" ? req.query.form : "";
      if (!form) {
        res.status(400).json({ message: "Missing 'form' query parameter" }); return;
      }
      const entry = await storage.getBdbPrefixEntry(form);
      if (!entry) {
        res.status(404).json({ message: "Entry not found" }); return;
      }
      res.json(entry);
    } catch (error) {
      console.error("BDB prefix entry error:", error);
      res.status(500).json({ message: "Failed to fetch BDB prefix entry" });
    }
  });

  return router;
}
