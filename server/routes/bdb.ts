import { Router } from "express";
import { storage } from "../storage";
import { searchRequestSchema, browseRequestSchema, autosuggestRequestSchema } from "@shared/schema";

export function createBdbRouter() {
  const router = Router();

  router.get("/api/bdb/search", async (req, res) => {
    try {
      const result = searchRequestSchema.safeParse(req.query);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid search query", errors: result.error.errors });
      }
      const entries = await storage.searchBdbEntries(result.data);
      res.json(entries);
    } catch (error) {
      console.error("BDB search error:", error);
      res.status(500).json({ message: "Failed to search BDB entries" });
    }
  });

  router.get("/api/bdb/browse", async (req, res) => {
    try {
      const result = browseRequestSchema.safeParse(req.query);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid browse request", errors: result.error.errors });
      }
      const entries = await storage.browseBdbByLetter(result.data);
      res.json(entries);
    } catch (error) {
      console.error("BDB browse error:", error);
      res.status(500).json({ message: "Failed to browse BDB entries" });
    }
  });

  router.get("/api/bdb/autosuggest", async (req, res) => {
    try {
      const result = autosuggestRequestSchema.safeParse(req.query);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid autosuggest request", errors: result.error.errors });
      }
      const suggestions = await storage.getBdbAutosuggest(result.data);
      res.json(suggestions);
    } catch (error) {
      console.error("BDB autosuggest error:", error);
      res.status(500).json({ message: "Failed to get BDB suggestions" });
    }
  });

  return router;
}
