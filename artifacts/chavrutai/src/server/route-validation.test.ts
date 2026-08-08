import { describe, it, expect } from "vitest";
import {
  isKnownAppPath,
  getNotFoundSEO,
} from "@workspace/shared-data/route-validation";

describe("isKnownAppPath — valid URLs", () => {
  it("accepts static pages", () => {
    for (const p of [
      "/",
      "/about",
      "/talmud",
      "/bible",
      "/mishnah",
      "/yerushalmi",
      "/rambam",
      "/scholarship",
      "/jastrow",
      "/bdb",
      "/search",
      "/sitemap",
      "/contact",
      "/changelog",
      "/privacy",
      "/blog-posts",
      "/biblical-index",
      "/term-index",
      "/mishnah-map",
      "/sugya-viewer",
      "/suggested-pages",
      "/external-links",
      "/jastrow/abbreviations",
      "/bdb/abbreviations",
      "/talmud/term-replacements",
    ]) {
      expect(isKnownAppPath(p), p).toBe(true);
    }
  });

  it("accepts valid Talmud tractates and folios", () => {
    expect(isKnownAppPath("/talmud/Berakhot")).toBe(true);
    expect(isKnownAppPath("/talmud/berakhot")).toBe(true); // non-canonical → redirected upstream
    expect(isKnownAppPath("/talmud/Berakhot/2a")).toBe(true);
    expect(isKnownAppPath("/talmud/Berakhot/64a")).toBe(true);
    expect(isKnownAppPath("/talmud/Shabbat/157b")).toBe(true);
    expect(isKnownAppPath("/talmud/Bava_Metzia/119a")).toBe(true);
  });

  it("accepts valid Bible books and chapters", () => {
    expect(isKnownAppPath("/bible/genesis")).toBe(true);
    expect(isKnownAppPath("/bible/genesis/1")).toBe(true);
    expect(isKnownAppPath("/bible/genesis/50")).toBe(true);
  });

  it("accepts valid Mishnah/Yerushalmi/Rambam paths", () => {
    expect(isKnownAppPath("/mishnah/peah")).toBe(true);
    expect(isKnownAppPath("/mishnah/peah/1")).toBe(true);
    expect(isKnownAppPath("/yerushalmi/berakhot")).toBe(true);
    expect(isKnownAppPath("/yerushalmi/berakhot/1.1")).toBe(true);
    expect(isKnownAppPath("/rambam/Repentance")).toBe(true);
    expect(isKnownAppPath("/rambam/Repentance/10")).toBe(true);
  });

  it("accepts scholarship works and lenient params", () => {
    expect(isKnownAppPath("/scholarship/introductions-tanaitic")).toBe(true);
    expect(
      isKnownAppPath("/scholarship/introductions-tanaitic/some-section"),
    ).toBe(true);
    expect(isKnownAppPath("/jastrow/headwords/A")).toBe(true);
    expect(isKnownAppPath("/bdb/headwords/B")).toBe(true);
    expect(isKnownAppPath("/biblical-index/book/Genesis")).toBe(true);
  });

  it("accepts only chapter outlines that actually exist", () => {
    expect(isKnownAppPath("/outline/sanhedrin/10")).toBe(true);
    expect(isKnownAppPath("/outline/Sanhedrin/10")).toBe(true);
  });

  it("accepts legacy redirect paths so redirects can happen", () => {
    expect(isKnownAppPath("/contents")).toBe(true);
    expect(isKnownAppPath("/dictionary")).toBe(true);
    expect(isKnownAppPath("/contents/berakhot")).toBe(true);
    expect(isKnownAppPath("/tractate/berakhot/5a")).toBe(true);
  });

  it("tolerates a trailing slash", () => {
    expect(isKnownAppPath("/talmud/")).toBe(true);
    expect(isKnownAppPath("/talmud/Berakhot/2a/")).toBe(true);
  });
});

describe("isKnownAppPath — invalid URLs (must 404)", () => {
  it("rejects unknown tractates/folios", () => {
    expect(isKnownAppPath("/talmud/fakename/5a")).toBe(false);
    expect(isKnownAppPath("/talmud/berakhot/999a")).toBe(false);
    expect(isKnownAppPath("/talmud/Berakhot/64b")).toBe(false); // last side is 'a'
    expect(isKnownAppPath("/talmud/Berakhot/1a")).toBe(false); // folios start at 2
    expect(isKnownAppPath("/talmud/Berakhot/5c")).toBe(false);
    expect(isKnownAppPath("/talmud/fakename")).toBe(false);
  });

  it("rejects unknown Bible books/chapters", () => {
    expect(isKnownAppPath("/bible/fakebook")).toBe(false);
    expect(isKnownAppPath("/bible/genesis/99")).toBe(false);
    expect(isKnownAppPath("/bible/genesis/0")).toBe(false);
    expect(isKnownAppPath("/bible/genesis/abc")).toBe(false);
  });

  it("rejects invalid Mishnah/Yerushalmi/Rambam params", () => {
    expect(isKnownAppPath("/mishnah/fake")).toBe(false);
    expect(isKnownAppPath("/mishnah/peah/99")).toBe(false);
    expect(isKnownAppPath("/yerushalmi/fake")).toBe(false);
    expect(isKnownAppPath("/yerushalmi/berakhot/99.1")).toBe(false);
    expect(isKnownAppPath("/rambam/fake")).toBe(false);
    expect(isKnownAppPath("/rambam/Repentance/999")).toBe(false);
  });

  it("rejects Yerushalmi halakhot recorded as missing", () => {
    expect(isKnownAppPath("/yerushalmi/shabbat/21.1")).toBe(false); // Shabbat 21+ missing
    expect(isKnownAppPath("/yerushalmi/makkot/3.1")).toBe(false); // Makkot ch. 3 missing
    expect(isKnownAppPath("/yerushalmi/yevamot/2.5")).toBe(false); // listed missing
    expect(isKnownAppPath("/yerushalmi/ketubot/4.5")).toBe(false); // listed missing
    // Present halakhot and bare legacy chapter URLs (301 upstream) stay valid
    expect(isKnownAppPath("/yerushalmi/shabbat/20.1")).toBe(true);
    expect(isKnownAppPath("/yerushalmi/yevamot/2.4")).toBe(true);
    expect(isKnownAppPath("/yerushalmi/shabbat/21")).toBe(true);
  });

  it("rejects outlines with no dataset", () => {
    expect(isKnownAppPath("/outline/berakhot/1")).toBe(false);
    expect(isKnownAppPath("/outline/sanhedrin/9")).toBe(false);
    expect(isKnownAppPath("/outline/fakename/10")).toBe(false);
  });

  it("rejects unknown scholarship works and random routes", () => {
    expect(isKnownAppPath("/scholarship/fake-work")).toBe(false);
    expect(isKnownAppPath("/no-such-page")).toBe(false);
    expect(isKnownAppPath("/talmud/Berakhot/2a/extra")).toBe(false);
    expect(isKnownAppPath("/wp-admin")).toBe(false);
  });
});

describe("getNotFoundSEO", () => {
  it("carries noindex and 404 messaging", () => {
    const seo = getNotFoundSEO("/no-such-page", "https://bekiut.com");
    expect(seo.robots).toBe("noindex, nofollow");
    expect(seo.title).toContain("Not Found");
    expect(seo.canonical).toBe("https://bekiut.com/no-such-page");
  });
});
