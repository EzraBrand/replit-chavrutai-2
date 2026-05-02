import { Router } from "express";
import { storage } from "../storage";
import { searchRequestSchema } from "@shared/schema";

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

  return router;
}
