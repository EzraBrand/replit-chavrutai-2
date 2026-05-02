import { Router } from "express";
import { storage } from "../storage";
import { searchRequestSchema, browseRequestSchema, autosuggestRequestSchema } from "@shared/schema";

export function createJastrowRouter() {
  const router = Router();

  router.get("/api/jastrow/search", async (req, res) => {
    try {
      const result = searchRequestSchema.safeParse(req.query);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid search query", errors: result.error.errors });
      }
      const entries = await storage.searchEntries(result.data);
      res.json(entries);
    } catch (error) {
      console.error("Jastrow search error:", error);
      res.status(500).json({ message: "Failed to search dictionary entries" });
    }
  });

  router.get("/api/jastrow/browse", async (req, res) => {
    try {
      const result = browseRequestSchema.safeParse(req.query);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid browse request", errors: result.error.errors });
      }
      const entries = await storage.browseByLetter(result.data);
      res.json(entries);
    } catch (error) {
      console.error("Jastrow browse error:", error);
      res.status(500).json({ message: "Failed to browse dictionary entries" });
    }
  });

  router.get("/api/jastrow/autosuggest", async (req, res) => {
    try {
      const result = autosuggestRequestSchema.safeParse(req.query);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid autosuggest request", errors: result.error.errors });
      }
      const suggestions = await storage.getAutosuggest(result.data);
      res.json(suggestions);
    } catch (error) {
      console.error("Jastrow autosuggest error:", error);
      res.status(500).json({ message: "Failed to get suggestions" });
    }
  });

  return router;
}
