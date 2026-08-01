import { Router } from "express";
import { SCHOLARSHIP_WORKS, getScholarshipWork } from "@workspace/shared-data/data/scholarship-works";
import { removeNikud } from "@workspace/text-processing";

const SEFARIA_BASE = "https://www.sefaria.org/api";

interface ScholarshipSection {
  key: string;
  slug: string;
  title: string;
  heTitle: string;
  sefariaPath: string; // path segment after workKey,_ (includes parent for nested nodes)
}

interface ScholarshipBook {
  title: string;
  heTitle: string;
  sections: ScholarshipSection[];
}

interface WorkIndexData {
  title: string;
  heTitle: string;
  author: string;
  description: string;
  topLevelSections: ScholarshipSection[];
  books: ScholarshipBook[];
  allSections: ScholarshipSection[];
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[''׳]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function buildSefariaRef(sefariaKey: string, sefariaPath: string): string {
  return `${sefariaKey},_${sefariaPath}`;
}

function flattenSchema(sefariaIndex: Record<string, unknown>, workSlug: string): WorkIndexData {
  const workInfo = getScholarshipWork(workSlug)!;
  const schema = sefariaIndex.schema as Record<string, unknown>;
  const nodes = (schema?.nodes as Record<string, unknown>[]) || [];

  const topLevelSections: ScholarshipSection[] = [];
  const books: ScholarshipBook[] = [];
  const allSections: ScholarshipSection[] = [];

  // Collect all raw sections to detect slug collisions
  const allRaw: Array<{ key: string; title: string; heTitle: string }> = [];
  for (const node of nodes) {
    const nodeType = node.nodeType as string | undefined;
    const childNodes = node.nodes as Record<string, unknown>[] | undefined;
    if (nodeType === "JaggedArrayNode") {
      allRaw.push({
        key: (node.key || node.title) as string,
        title: (node.title || "") as string,
        heTitle: (node.heTitle || "") as string,
      });
    } else if (childNodes) {
      for (const child of childNodes) {
        if ((child.nodeType as string) === "JaggedArrayNode") {
          allRaw.push({
            key: (child.key || child.title) as string,
            title: (child.title || "") as string,
            heTitle: (child.heTitle || "") as string,
          });
        }
      }
    }
  }

  // Count slug occurrences to detect collisions
  const slugCount = new Map<string, number>();
  for (const r of allRaw) {
    const base = slugify(r.title);
    slugCount.set(base, (slugCount.get(base) || 0) + 1);
  }
  const slugUsed = new Map<string, number>();

  function assignSlug(title: string): string {
    const base = slugify(title);
    const total = slugCount.get(base) || 1;
    if (total === 1) return base;
    const count = (slugUsed.get(base) || 0) + 1;
    slugUsed.set(base, count);
    return count === 1 ? base : `${base}-${count}`;
  }

  // Build structured index
  for (const node of nodes) {
    const nodeType = node.nodeType as string | undefined;
    const childNodes = node.nodes as Record<string, unknown>[] | undefined;

    if (nodeType === "JaggedArrayNode") {
      const key = (node.key || node.title) as string;
      const section: ScholarshipSection = {
        key,
        slug: assignSlug((node.title || "") as string),
        title: (node.title || "") as string,
        heTitle: (node.heTitle || "") as string,
        sefariaPath: key.replace(/ /g, "_"),
      };
      topLevelSections.push(section);
      allSections.push(section);
    } else if (childNodes && childNodes.length > 0) {
      const parentKey = (node.key || node.title) as string;
      const parentPath = parentKey.replace(/ /g, "_");
      const book: ScholarshipBook = {
        title: (node.title || "") as string,
        heTitle: (node.heTitle || "") as string,
        sections: [],
      };
      for (const child of childNodes) {
        if ((child.nodeType as string) === "JaggedArrayNode") {
          const childKey = (child.key || child.title) as string;
          const section: ScholarshipSection = {
            key: childKey,
            slug: assignSlug((child.title || "") as string),
            title: (child.title || "") as string,
            heTitle: (child.heTitle || "") as string,
            sefariaPath: `${parentPath},_${childKey.replace(/ /g, "_")}`,
          };
          book.sections.push(section);
          allSections.push(section);
        }
      }
      if (book.sections.length > 0) {
        books.push(book);
      }
    }
  }

  return {
    title: (sefariaIndex.title as string) || workInfo.title,
    heTitle: (sefariaIndex.heTitle as string) || workInfo.heTitle,
    author: workInfo.author,
    description: workInfo.description,
    topLevelSections,
    books,
    allSections,
  };
}

export function createScholarshipRouter(): Router {
  const router = Router();

  // In-memory cache: work slug → parsed index (schema/TOC only)
  const indexCache = new Map<string, WorkIndexData>();

  // GET /api/scholarship/works — list all supported works
  router.get("/api/scholarship/works", (_req, res) => {
    res.json(
      SCHOLARSHIP_WORKS.map(({ slug, title, heTitle, author, description, type }) => ({
        slug,
        title,
        heTitle,
        author,
        description,
        type,
      }))
    );
  });

  // GET /api/scholarship/:workSlug/index — schema/TOC (cached)
  router.get("/api/scholarship/:workSlug/index", async (req, res) => {
    const { workSlug } = req.params;
    const work = getScholarshipWork(workSlug);
    if (!work) {
      res.status(404).json({ error: `Unknown work: ${workSlug}` });
      return;
    }

    if (indexCache.has(workSlug)) {
      const cached = indexCache.get(workSlug)!;
      res.json({
        title: cached.title,
        heTitle: cached.heTitle,
        author: cached.author,
        description: cached.description,
        topLevelSections: cached.topLevelSections,
        books: cached.books,
      });
      return;
    }

    try {
      const response = await fetch(`${SEFARIA_BASE}/index/${work.sefariaKey}`);
      if (!response.ok) {
        res.status(502).json({ error: "Failed to fetch index from Sefaria" });
        return;
      }
      const sefariaIndex: any = await response.json();
      const parsed = flattenSchema(sefariaIndex, workSlug);
      indexCache.set(workSlug, parsed);

      res.json({
        title: parsed.title,
        heTitle: parsed.heTitle,
        author: parsed.author,
        description: parsed.description,
        topLevelSections: parsed.topLevelSections,
        books: parsed.books,
      });
    } catch (err) {
      console.error("Error fetching scholarship index:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // GET /api/scholarship/:workSlug/section?sectionSlug=... — live section text
  router.get("/api/scholarship/:workSlug/section", async (req, res) => {
    const { workSlug } = req.params;
    const { sectionSlug } = req.query as { sectionSlug: string };

    if (!sectionSlug) {
      res.status(400).json({ error: "sectionSlug query param required" });
      return;
    }

    const work = getScholarshipWork(workSlug);
    if (!work) {
      res.status(404).json({ error: `Unknown work: ${workSlug}` });
      return;
    }

    // Ensure index is cached (fetch if needed to resolve slug→key)
    let index = indexCache.get(workSlug);
    if (!index) {
      try {
        const response = await fetch(`${SEFARIA_BASE}/index/${work.sefariaKey}`);
        if (!response.ok) {
          res.status(502).json({ error: "Failed to fetch index from Sefaria" });
          return;
        }
        const sefariaIndex: any = await response.json();
        index = flattenSchema(sefariaIndex, workSlug);
        indexCache.set(workSlug, index);
      } catch (err) {
        console.error("Error fetching scholarship index for section lookup:", err);
        res.status(500).json({ error: "Internal server error" });
        return;
      }
    }

    // Look up the section by slug
    const section = index.allSections.find((s) => s.slug === sectionSlug);
    if (!section) {
      res.status(404).json({ error: `Section not found: ${sectionSlug}` });
      return;
    }

    // Compute prev/next from ordered flat list
    const idx = index.allSections.indexOf(section);
    const prevSection = idx > 0 ? { slug: index.allSections[idx - 1].slug, title: index.allSections[idx - 1].title } : null;
    const nextSection = idx < index.allSections.length - 1 ? { slug: index.allSections[idx + 1].slug, title: index.allSections[idx + 1].title } : null;

    // Fetch section text live from Sefaria (not cached)
    try {
      const ref = buildSefariaRef(work.sefariaKey, section.sefariaPath);
      const url = `${SEFARIA_BASE}/v3/texts/${encodeURIComponent(ref)}?context=0&pad=0`;
      const response = await fetch(url);

      if (!response.ok) {
        res.status(502).json({ error: "Failed to fetch section text from Sefaria" });
        return;
      }

      const data: any = await response.json();
      const versions = Array.isArray(data.versions) ? data.versions : [];
      const heVersion = versions.find((v: { language: string }) => v.language === "he");
      const rawParagraphs: string[] = Array.isArray(heVersion?.text) ? heVersion.text : [];

      const paragraphs = rawParagraphs
        .filter((p: string) => p && p.trim())
        .map((p: string) => removeNikud(p));

      res.json({
        title: section.title,
        heTitle: section.heTitle,
        paragraphs,
        prevSection,
        nextSection,
        sefariaRef: ref,
      });
    } catch (err) {
      console.error("Error fetching scholarship section text:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  return router;
}
