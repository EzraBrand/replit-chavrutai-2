import { useState } from "react";

const BOOKS = [
  { title: "Editor's Preface", single: true, sections: ["Editor's Preface"] },
  {
    title: "Introduction to Mishnah and Tosefta",
    sections: [
      "Preface", "Ancient Tannaitic Compilations", "First Mishnah",
      "Remains of Ancient Tannaitic Compilations",
      "The Mishnayot of the Middle Generation",
      "The Mishnah of Rabbi Akiva", "How was the Mishnah Arranged",
      "Rebbi and His Mishnah", "Our Mishnah", "Appendix", "Introduction to Tosefta",
    ],
  },
  {
    title: "Introductions to Tractates of the Mishnah",
    sections: [
      "Challah", "Shabbat", "Eruvin", "Pesachim", "Shekalim",
      "Sukkah", "Beitzha (Yom Tov)", "Rosh HaShanah", "Chagigah",
      "Nedarim", "Nazir", "Sotah", "Kiddushin", "Sanhedrin Makkot",
    ],
  },
  {
    title: "Introduction to Halakhic Midrashim",
    sections: [
      "Introduction", "Mekhilta of Rabbi Ishmael", "Sifrei Numbers",
      "Sifra Torat Kohanim", "Sifrei Deuteronomy", "Mekhilta of Rashbi",
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

export default function DrawerNav() {
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({ 0: false, 1: true, 2: false, 3: false });

  return (
    <div style={{ height: "100vh", background: "#fff", fontFamily: "system-ui, sans-serif", fontSize: 13, overflow: "hidden", position: "relative" }}>

      {/* ── Header ── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 30,
        borderBottom: "1px solid #e5e7eb", padding: "10px 20px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "#fff",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: PRIMARY, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "#fff", fontSize: 12 }}>📖</span>
          </div>
          <span style={{ fontWeight: 700, fontSize: 14, color: "#111827" }}>ChavrutAI</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={{ padding: "5px 12px", border: "1px solid #e5e7eb", borderRadius: 6, background: "#fff", fontSize: 12, cursor: "pointer" }}>
            T Display
          </button>
          <button
            onClick={() => setDrawerOpen(true)}
            style={{
              padding: "5px 12px", border: `1px solid ${PRIMARY}40`, borderRadius: 6,
              background: "#eff6ff", fontSize: 12, cursor: "pointer", color: PRIMARY, fontWeight: 500, display: "flex", alignItems: "center", gap: 5,
            }}
          >
            ☰ Contents
          </button>
        </div>
      </header>

      {/* Progress bar */}
      <div style={{ height: 2, background: "#f3f4f6" }}>
        <div style={{ width: "34%", height: "100%", background: PRIMARY, transition: "width 0.2s" }} />
      </div>

      {/* ── Drawer overlay ── */}
      {drawerOpen && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 40,
            display: "flex",
          }}
          onClick={() => setDrawerOpen(false)}
        >
          {/* Backdrop */}
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.3)" }} />

          {/* Drawer panel */}
          <div
            style={{
              position: "relative", zIndex: 50, width: 320, height: "100%",
              background: "#fff", boxShadow: "4px 0 24px rgba(0,0,0,0.12)",
              display: "flex", flexDirection: "column",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer header */}
            <div style={{ padding: "16px", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: "#111827", lineHeight: 1.3 }}>
                  Introductions to Tanaitic Literature
                </div>
                <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 3 }}>J.N. Epstein · Modern Scholarship</div>
              </div>
              <button onClick={() => setDrawerOpen(false)}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#9ca3af", lineHeight: 1, padding: 0 }}>
                ×
              </button>
            </div>

            {/* Drawer content */}
            <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
              {BOOKS.map((book, i) => (
                <div key={i} style={{ marginBottom: 2 }}>
                  {book.single ? (
                    <button style={{
                      width: "100%", textAlign: "left", padding: "8px 12px", borderRadius: 6, border: "none",
                      cursor: "pointer", fontSize: 12, fontWeight: 500,
                      background: CURRENT === book.sections[0] ? "#eff6ff" : "none",
                      color: CURRENT === book.sections[0] ? PRIMARY : "#374151",
                    }}>
                      {book.title}
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => setExpanded((p) => ({ ...p, [i]: !p[i] }))}
                        style={{
                          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                          padding: "7px 12px", borderRadius: 6, border: "none", cursor: "pointer", background: "none",
                        }}
                      >
                        <span style={{ fontSize: 10, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: 6 }}>
                          {book.title}
                        </span>
                        <span style={{ fontSize: 10, color: "#9ca3af", flexShrink: 0 }}>{expanded[i] ? "▼" : "▶"}</span>
                      </button>
                      {expanded[i] && (
                        <div style={{ marginLeft: 12, paddingLeft: 12, borderLeft: "2px solid #e5e7eb", marginBottom: 4 }}>
                          {book.sections.map((sec) => {
                            const active = sec === CURRENT;
                            return (
                              <button
                                key={sec}
                                onClick={() => setDrawerOpen(false)}
                                style={{
                                  width: "100%", textAlign: "left", padding: "6px 8px", borderRadius: 5,
                                  fontSize: 12, border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                                  background: "none",
                                  color: active ? PRIMARY : "#374151",
                                  fontWeight: active ? 600 : 400,
                                }}
                              >
                                {active && <span style={{ width: 5, height: 5, borderRadius: "50%", background: PRIMARY, flexShrink: 0 }} />}
                                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sec}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}

              <div style={{ height: 1, background: "#e5e7eb", margin: "8px 0" }} />
              <div style={{ padding: "4px 12px 8px", fontSize: 11, color: "#9ca3af", fontStyle: "italic" }}>
                Currently reading: paragraph 14 of 46
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Reading content ── */}
      <div style={{ height: "calc(100vh - 51px)", overflowY: "auto", padding: "32px 48px" }}>
        <nav style={{ fontSize: 11, color: "#9ca3af", marginBottom: 20, display: "flex", gap: 4 }}>
          <span>Modern Scholarship</span><span>›</span>
          <span>Introductions to Tanaitic Literature</span><span>›</span>
          <span style={{ color: "#374151" }}>Ancient Tannaitic Compilations</span>
        </nav>

        <div style={{ maxWidth: 540, margin: "0 auto" }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "#111827", marginBottom: 4 }}>Ancient Tannaitic Compilations</h1>
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
