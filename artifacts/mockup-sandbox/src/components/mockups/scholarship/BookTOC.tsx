import { useState } from "react";

const PALETTE = {
  bg: "hsl(28, 37%, 94%)",
  surface: "hsl(28, 30%, 96%)",
  foreground: "hsl(25, 12%, 18%)",
  muted: "hsl(25, 8%, 42%)",
  border: "hsl(25, 18%, 80%)",
  primary: "hsl(203, 30%, 26%)",
  accent: "hsl(28, 20%, 88%)",
};

const WORKS = [
  {
    slug: "introductions-tanaitic",
    title: "Introductions to Tanaitic Literature",
    heTitle: "מבואות לספרות התנאים",
    author: "Jacob Nahum Epstein",
    heAuthor: "יעקב נחום אפשטיין",
    description: "Epstein's monumental introduction to the Mishnah, Tosefta, and Halakhic Midrashim.",
    category: "Talmud — Guides",
    type: "book" as const,
    books: [
      {
        title: "Editor's Preface",
        heTitle: "דבר העורך",
        sections: []
      },
      {
        title: "Introduction to Mishnah and Tosefta",
        heTitle: "מבוא למשנה ולתוספתא",
        sections: [
          { title: "Preface", heTitle: "פתח דבר" },
          { title: "Ancient Tannaitic Compilations", heTitle: "קָבצי משניות קדומים" },
          { title: "First Mishnah", heTitle: "משנה ראשונה" },
          { title: "Remains of Ancient Compilations", heTitle: "שרידי קָבצי משניות קדומים" },
          { title: "The Mishnayot of the Middle Generation", heTitle: "משניות הביניים" },
          { title: "The Mishnah of Rabbi Akiva", heTitle: "משנת ר׳ עקיבא" },
          { title: "How was the Mishnah Arranged?", heTitle: "כיצד סדר משנה?" },
          { title: "The Mishnayot of the Disciples of Rabbi Akiva", heTitle: "משניות תלמידי ר׳ עקיבא" },
          { title: "Rebbi and His Mishnah", heTitle: "רבי ומשנתו" },
          { title: "Our Mishnah", heTitle: "משנתנו" },
          { title: "Introduction to Tosefta", heTitle: "מבוא לתוספתא" },
        ]
      },
      {
        title: "Introductions to Tractates of the Mishnah",
        heTitle: "מבואות למסכות מן המשנה",
        sections: [
          { title: "Preface", heTitle: "פתח דבר" },
          { title: "Challah", heTitle: "חלה" },
          { title: "Shabbat", heTitle: "שבת" },
          { title: "Eruvin", heTitle: "עירובין" },
          { title: "Pesachim", heTitle: "פסחים" },
          { title: "Rosh HaShanah", heTitle: "ראש השנה" },
          { title: "Sanhedrin Makkot", heTitle: "סנהדרין מכות" },
          { title: "Kelim", heTitle: "כלים" },
        ]
      },
      {
        title: "Introduction to Halakhic Midrashim",
        heTitle: "מבוא למדרשי הלכה",
        sections: [
          { title: "Introduction", heTitle: "הקדמה" },
          { title: "Mekhilta of Rabbi Ishmael", heTitle: "מכילתא דר׳ ישמעאל" },
          { title: "Sifrei Numbers", heTitle: "ספרי במדבר" },
          { title: "Sifra Torat Kohanim", heTitle: "ספרא — תורת כהנים" },
          { title: "Sifrei Deuteronomy", heTitle: "ספרי דברים" },
          { title: "Mekhilta of Rashbi", heTitle: "מכילתא דרשב״י" },
        ]
      },
    ]
  },
  {
    slug: "introductions-amoraic",
    title: "Introductions to Amoraic Literature",
    heTitle: "מבואות לספרות האמוראים",
    author: "Jacob Nahum Epstein",
    heAuthor: "יעקב נחום אפשטיין",
    description: "Epstein's introduction to the Babylonian Talmud and the literature of the Amoraic period.",
    category: "Talmud — Guides",
    type: "book" as const,
    books: [],
  },
  {
    slug: "mishnat-eretz-yisrael-challah",
    title: "Mishnat Eretz Yisrael on Challah",
    heTitle: "משנת ארץ ישראל על חלה",
    author: "Yehuda Felix et al.",
    heAuthor: "",
    description: "Modern Israeli commentary on Mishnah Challah integrating archaeology and Land of Israel scholarship.",
    category: "Mishnah — Modern Commentary",
    type: "commentary" as const,
    chapters: 4,
  }
];

export function BookTOC() {
  const [expandedWork, setExpandedWork] = useState<string>("introductions-tanaitic");
  const [expandedBooks, setExpandedBooks] = useState<string[]>(["Introduction to Mishnah and Tosefta"]);

  const toggleBook = (title: string) => {
    setExpandedBooks(prev =>
      prev.includes(title) ? prev.filter(t => t !== title) : [...prev, title]
    );
  };

  const work = WORKS.find(w => w.slug === expandedWork)!;

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", backgroundColor: PALETTE.bg, color: PALETTE.foreground, minHeight: "100vh", display: "flex", flexDirection: "column" }}>

      {/* Header */}
      <header style={{ height: "52px", backgroundColor: PALETTE.surface, borderBottom: `1px solid ${PALETTE.border}`, display: "flex", alignItems: "center", padding: "0 28px", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: PALETTE.muted }}>
          <span style={{ color: PALETTE.primary, cursor: "pointer" }}>ChavrutAI</span>
          <span style={{ color: PALETTE.border }}>›</span>
          <span style={{ color: PALETTE.foreground, fontWeight: 500 }}>Modern Scholarship</span>
        </div>
      </header>

      <div style={{ display: "flex", flex: 1 }}>

        {/* Left: work list */}
        <aside style={{ width: "280px", flexShrink: 0, borderRight: `1px solid ${PALETTE.border}`, backgroundColor: PALETTE.surface, overflowY: "auto", position: "sticky", top: "52px", maxHeight: "calc(100vh - 52px)" }}>
          <div style={{ padding: "20px 0" }}>
            <div style={{ padding: "0 20px 12px", fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: PALETTE.muted }}>
              Works
            </div>
            {WORKS.map(w => (
              <button
                key={w.slug}
                onClick={() => setExpandedWork(w.slug)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "10px 20px",
                  background: expandedWork === w.slug ? PALETTE.accent : "none",
                  border: "none",
                  cursor: "pointer",
                  borderLeft: expandedWork === w.slug ? `3px solid ${PALETTE.primary}` : "3px solid transparent",
                  display: "flex",
                  flexDirection: "column",
                  gap: "2px",
                }}
              >
                <span style={{ fontSize: "13px", fontWeight: expandedWork === w.slug ? 600 : 400, color: expandedWork === w.slug ? PALETTE.primary : PALETTE.foreground, lineHeight: "1.35" }}>
                  {w.title}
                </span>
                <span style={{ fontSize: "11px", color: PALETTE.muted }}>
                  {w.category}
                </span>
              </button>
            ))}
          </div>
        </aside>

        {/* Right: TOC for selected work */}
        <main style={{ flex: 1, overflowY: "auto", padding: "36px 40px" }}>
          <div style={{ maxWidth: "640px" }}>

            {/* Work header */}
            <div style={{ marginBottom: "32px" }}>
              <div style={{ fontSize: "11px", color: PALETTE.muted, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "8px" }}>
                {work.category}
              </div>
              <h1 style={{ fontSize: "24px", fontWeight: 600, lineHeight: "1.3", marginBottom: "6px", margin: "0 0 4px" }}>
                {work.title}
              </h1>
              <div style={{ fontSize: "20px", color: PALETTE.muted, direction: "rtl", textAlign: "right", fontFamily: "'SBL Hebrew', 'Frank Ruhl Libre', serif", lineHeight: "1.6", marginBottom: "10px" }}>
                {work.heTitle}
              </div>
              <div style={{ fontSize: "13px", color: PALETTE.muted, marginBottom: "12px" }}>
                {work.author}
              </div>
              <p style={{ fontSize: "14px", color: PALETTE.muted, lineHeight: "1.6", margin: "0 0 0" }}>
                {work.description}
              </p>
            </div>

            <div style={{ height: "1px", backgroundColor: PALETTE.border, marginBottom: "28px" }} />

            {/* TOC — book reader */}
            {work.type === "book" && "books" in work && (
              <div>
                <div style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: PALETTE.muted, marginBottom: "16px" }}>
                  Table of Contents
                </div>
                {work.books.map(book => (
                  <div key={book.title} style={{ marginBottom: "4px" }}>
                    <button
                      onClick={() => book.sections.length > 0 && toggleBook(book.title)}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: "10px 14px",
                        background: expandedBooks.includes(book.title) ? PALETTE.accent : PALETTE.surface,
                        border: `1px solid ${PALETTE.border}`,
                        borderRadius: expandedBooks.includes(book.title) ? "6px 6px 0 0" : "6px",
                        cursor: book.sections.length > 0 ? "pointer" : "default",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <div style={{ fontSize: "14px", fontWeight: 500, color: PALETTE.foreground, lineHeight: "1.35" }}>
                          {book.title}
                        </div>
                        <div style={{ fontSize: "13px", color: PALETTE.muted, fontFamily: "'SBL Hebrew', 'Frank Ruhl Libre', serif", direction: "rtl", marginTop: "2px" }}>
                          {book.heTitle}
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        {book.sections.length === 0 && (
                          <span style={{ fontSize: "12px", color: PALETTE.primary }}>Read →</span>
                        )}
                        {book.sections.length > 0 && (
                          <span style={{ fontSize: "11px", color: PALETTE.muted }}>
                            {expandedBooks.includes(book.title) ? "▾" : "▸"}
                          </span>
                        )}
                      </div>
                    </button>

                    {expandedBooks.includes(book.title) && book.sections.length > 0 && (
                      <div style={{ border: `1px solid ${PALETTE.border}`, borderTop: "none", borderRadius: "0 0 6px 6px", overflow: "hidden", marginBottom: "0" }}>
                        {book.sections.map((section, si) => (
                          <div
                            key={section.title}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              padding: "9px 14px 9px 24px",
                              borderTop: si > 0 ? `1px solid ${PALETTE.border}` : "none",
                              backgroundColor: PALETTE.bg,
                              cursor: "pointer",
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              <span style={{ fontSize: "11px", color: PALETTE.border, width: "18px", textAlign: "right", flexShrink: 0 }}>{si + 1}</span>
                              <div>
                                <div style={{ fontSize: "13px", color: PALETTE.foreground }}>{section.title}</div>
                                <div style={{ fontSize: "12px", color: PALETTE.muted, fontFamily: "'SBL Hebrew', 'Frank Ruhl Libre', serif", direction: "rtl", marginTop: "1px" }}>{section.heTitle}</div>
                              </div>
                            </div>
                            <span style={{ fontSize: "12px", color: PALETTE.primary, flexShrink: 0 }}>Read →</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* TOC — commentary */}
            {work.type === "commentary" && "chapters" in work && (
              <div>
                <div style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: PALETTE.muted, marginBottom: "16px" }}>
                  Chapters
                </div>
                <div style={{ border: `1px solid ${PALETTE.border}`, borderRadius: "6px", overflow: "hidden" }}>
                  {[{ key: "intro", label: "Introduction", he: "הקדמה" }, { key: "preface", label: "Preface", he: "מבוא" }].map((item, i) => (
                    <div key={item.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 16px", borderBottom: `1px solid ${PALETTE.border}`, backgroundColor: PALETTE.surface, cursor: "pointer" }}>
                      <div>
                        <div style={{ fontSize: "13px", color: PALETTE.foreground }}>{item.label}</div>
                        <div style={{ fontSize: "12px", color: PALETTE.muted, fontFamily: "'SBL Hebrew', 'Frank Ruhl Libre', serif", direction: "rtl" }}>{item.he}</div>
                      </div>
                      <span style={{ fontSize: "12px", color: PALETTE.primary }}>Read →</span>
                    </div>
                  ))}
                  {Array.from({ length: work.chapters }, (_, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 16px", borderBottom: i < work.chapters - 1 ? `1px solid ${PALETTE.border}` : "none", backgroundColor: PALETTE.bg, cursor: "pointer" }}>
                      <div>
                        <div style={{ fontSize: "13px", color: PALETTE.foreground }}>Chapter {i + 1}</div>
                        <div style={{ fontSize: "12px", color: PALETTE.muted, fontFamily: "'SBL Hebrew', 'Frank Ruhl Libre', serif", direction: "rtl" }}>פרק {["א", "ב", "ג", "ד"][i]}</div>
                      </div>
                      <span style={{ fontSize: "12px", color: PALETTE.primary }}>Read →</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
