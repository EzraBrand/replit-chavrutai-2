import { useState, useMemo } from "react";

const BOOKS = [
  { label: "Top Level", sections: ["Editor's Preface"] },
  {
    label: "Introduction to Mishnah and Tosefta",
    sections: [
      "Preface", "Ancient Tannaitic Compilations", "First Mishnah",
      "Remains of Ancient Tannaitic Compilations",
      "The Mishnayot of the Middle Generation",
      "The Mishnah of Rabbi Akiva", "How was the Mishnah Arranged",
      "The Mishnayot of the Disciples of Rabbi Akiva",
      "Rebbi and His Mishnah", "Our Mishnah", "Appendix",
      "Introduction to Tosefta",
    ],
  },
  {
    label: "Introductions to Tractates of the Mishnah",
    sections: [
      "Challah", "Shabbat", "Eruvin", "Pesachim", "Shekalim",
      "Sukkah", "Beitzha (Yom Tov)", "Rosh HaShanah", "Chagigah",
      "Nedarim", "Nazir", "Sotah", "Kiddushin", "Sanhedrin Makkot",
      "Eduyot", "Bekhorot", "Temurah", "Kelim",
    ],
  },
  {
    label: "Introduction to Halakhic Midrashim",
    sections: [
      "Introduction", "Halakhic Midrash",
      "The Midrashim outside the Land of Israel",
      "Rabbi Ishmael and the Disciples of Rabbi Ishmael",
      "Mekhilta of Rabbi Ishmael", "Sifrei Numbers",
      "Sifra Torat Kohanim", "Sifrei Deuteronomy",
      "Mekhilta of Rashbi", "Sifrei Zuta",
    ],
  },
];

const CURRENT = "Ancient Tannaitic Compilations";
const PRIMARY = "#2563eb";

const PARAGRAPHS = [
  "ל. קבצי משניות קדומים",
  "שני הם המקורות המעידים על קובצי הלכות קדומים: מקורות, שמחוץ למשנה ועדויות מפורשות במשנה עצמה.",
  "א. מקורות חיצוניים ופנימיים",
  "המקורות המעידים על קובצי הלכות, על-פ שהם מדברי אגדה, הרי יש להם בוודאי יסוד היסטורי.",
];

export default function CommandPalette() {
  const [open, setOpen] = useState(true);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query.trim()) return BOOKS;
    const q = query.toLowerCase();
    return BOOKS.map((book) => ({
      ...book,
      sections: book.sections.filter((s) => s.toLowerCase().includes(q)),
    })).filter((b) => b.sections.length > 0);
  }, [query]);

  return (
    <div style={{ height: "100vh", background: "#fff", fontFamily: "system-ui, sans-serif", fontSize: 13, overflow: "hidden", position: "relative" }}>

      {/* ── Header ── */}
      <header style={{
        borderBottom: "1px solid #e5e7eb", padding: "10px 20px",
        display: "flex", alignItems: "center", gap: 16, background: "#fff",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: PRIMARY, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "#fff", fontSize: 12 }}>📖</span>
          </div>
          <span style={{ fontWeight: 700, fontSize: 14, color: "#111827" }}>ChavrutAI</span>
        </div>

        {/* Jump trigger — looks like a search bar */}
        <div style={{ flex: 1, maxWidth: 360 }}>
          <button
            onClick={() => setOpen(true)}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: 8,
              padding: "6px 12px", borderRadius: 8, border: "1px solid #e5e7eb",
              background: "#f9fafb", color: "#9ca3af", fontSize: 12, cursor: "pointer",
              textAlign: "left",
            }}
          >
            <span style={{ fontSize: 13 }}>🔍</span>
            <span style={{ flex: 1 }}>Jump to section...</span>
            <span style={{
              fontSize: 10, fontFamily: "monospace", background: "#e5e7eb",
              color: "#6b7280", padding: "1px 6px", borderRadius: 4,
            }}>
              ⌘K
            </span>
          </button>
        </div>

        <button style={{ padding: "5px 12px", border: "1px solid #e5e7eb", borderRadius: 6, background: "#fff", fontSize: 12, cursor: "pointer" }}>
          T Display
        </button>
      </header>

      {/* Progress bar */}
      <div style={{ height: 2, background: "#f3f4f6" }}>
        <div style={{ width: "34%", height: "100%", background: PRIMARY }} />
      </div>

      {/* ── Command palette overlay ── */}
      {open && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 50,
            display: "flex", alignItems: "flex-start", justifyContent: "center",
            paddingTop: 80, background: "rgba(0,0,0,0.4)",
          }}
          onClick={() => { setOpen(false); setQuery(""); }}
        >
          <div
            style={{
              background: "#fff", borderRadius: 12, boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
              width: 520, maxHeight: 520, display: "flex", flexDirection: "column", overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search input */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderBottom: "1px solid #f3f4f6" }}>
              <span style={{ color: "#9ca3af", fontSize: 15 }}>🔍</span>
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search sections…"
                style={{
                  flex: 1, border: "none", outline: "none", fontSize: 14,
                  color: "#111827", background: "transparent",
                }}
              />
              <span style={{
                fontSize: 10, fontFamily: "monospace", background: "#f3f4f6",
                color: "#9ca3af", padding: "2px 6px", borderRadius: 4,
              }}>
                ESC
              </span>
            </div>

            {/* Results */}
            <div style={{ flex: 1, overflowY: "auto" }}>
              {filtered.length === 0 && (
                <div style={{ padding: "24px 16px", textAlign: "center", color: "#9ca3af", fontSize: 13 }}>
                  No sections found.
                </div>
              )}
              {filtered.map((book, bi) => (
                <div key={bi}>
                  {book.label !== "Top Level" && (
                    <div style={{
                      padding: "8px 16px 4px", fontSize: 10, fontWeight: 700,
                      color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em",
                    }}>
                      {book.label}
                    </div>
                  )}
                  {book.sections.map((sec) => {
                    const active = sec === CURRENT;
                    return (
                      <button
                        key={sec}
                        onClick={() => { setOpen(false); setQuery(""); }}
                        style={{
                          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                          padding: "8px 16px", border: "none", cursor: "pointer",
                          background: active ? "#eff6ff" : "none",
                          textAlign: "left",
                        }}
                        onMouseOver={(e) => { if (!active) e.currentTarget.style.background = "#f9fafb"; }}
                        onMouseOut={(e) => { if (!active) e.currentTarget.style.background = "none"; }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          {active && <span style={{ width: 5, height: 5, borderRadius: "50%", background: PRIMARY, flexShrink: 0 }} />}
                          <span style={{ fontSize: 13, color: active ? PRIMARY : "#374151", fontWeight: active ? 600 : 400 }}>
                            {sec}
                          </span>
                          {active && (
                            <span style={{
                              fontSize: 10, color: "#93c5fd", background: "#eff6ff",
                              padding: "1px 7px", borderRadius: 20, border: "1px solid #bfdbfe",
                            }}>
                              current
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: 13, color: "#d1d5db" }}>›</span>
                      </button>
                    );
                  })}
                  {bi < filtered.length - 1 && <div style={{ height: 1, background: "#f3f4f6", margin: "2px 0" }} />}
                </div>
              ))}
            </div>

            {/* Footer hints */}
            <div style={{
              borderTop: "1px solid #f3f4f6", padding: "8px 16px",
              display: "flex", gap: 16, fontSize: 10, color: "#9ca3af", background: "#f9fafb",
            }}>
              {[["↑↓", "navigate"], ["↵", "go to section"], ["esc", "close"]].map(([key, label]) => (
                <span key={key} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <kbd style={{ background: "#e5e7eb", padding: "1px 5px", borderRadius: 3, fontFamily: "monospace", fontSize: 10 }}>{key}</kbd>
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Reading content ── */}
      <div style={{ height: "calc(100vh - 51px)", overflowY: "auto", padding: "28px 48px" }}>
        <nav style={{ fontSize: 11, color: "#9ca3af", marginBottom: 20, display: "flex", gap: 4 }}>
          <span>Modern Scholarship</span><span>›</span>
          <span>Introductions to Tanaitic Literature</span><span>›</span>
          <span style={{ color: "#374151" }}>Ancient Tannaitic Compilations</span>
        </nav>

        <div style={{ maxWidth: 540, margin: "0 auto" }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "#111827", marginBottom: 4 }}>
            Ancient Tannaitic Compilations
          </h1>
          <div style={{ fontSize: 16, color: "#9ca3af", marginBottom: 28, textAlign: "right", direction: "rtl" }}>
            קבצי משניות קדומים
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {PARAGRAPHS.map((p, i) => (
              <div key={i} style={{ display: "flex", gap: 14 }}>
                <span style={{ fontSize: 10, color: "#d1d5db", marginTop: 3, width: 14, textAlign: "right", flexShrink: 0 }}>{i + 1}</span>
                <p style={{ flex: 1, color: "#1f2937", lineHeight: 1.8, direction: "rtl", textAlign: "right", fontFamily: "serif", margin: 0 }}>
                  {p}
                </p>
              </div>
            ))}
          </div>

          <div style={{ borderTop: "1px solid #e5e7eb", marginTop: 40, paddingTop: 20, display: "flex", justifyContent: "space-between", fontSize: 12 }}>
            <button style={{ color: PRIMARY, background: "none", border: "none", cursor: "pointer" }}>‹ First Mishnah</button>
            <button style={{ color: PRIMARY, background: "none", border: "none", cursor: "pointer" }}>Preface ›</button>
          </div>
        </div>
      </div>
    </div>
  );
}
