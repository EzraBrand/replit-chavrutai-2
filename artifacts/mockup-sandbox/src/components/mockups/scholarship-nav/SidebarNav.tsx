import { useState } from "react";

const BOOKS = [
  {
    title: "Introduction to Mishnah and Tosefta",
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
    title: "Introductions to Tractates of the Mishnah",
    sections: [
      "Preface", "Challah", "Shabbat", "Eruvin", "Pesachim",
      "Shekalim", "Sukkah", "Beitzha (Yom Tov)", "Rosh HaShanah",
      "Chagigah", "Nedarim", "Nazir", "Sotah", "Kiddushin",
      "Sanhedrin Makkot", "Eduyot", "Bekhorot", "Temurah", "Kelim",
    ],
  },
  {
    title: "Introduction to Halakhic Midrashim",
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
const SIDEBAR_W = 256;

const PARAGRAPHS = [
  "ל. קבצי משניות קדומים",
  "שני הם המקורות המעידים על קובצי הלכות קדומים: מקורות, שמחוץ למשנה ועדויות מפורשות במשנה עצמה.",
  "א. מקורות חיצוניים ופנימיים",
  "המקורות המעידים על קובצי הלכות, על-פ שהם מדברי אגדה, הרי יש להם בוודאי יסוד היסטורי. המקורות האלה הם:",
  "עזרא (הרביעי), ספר שנתחבר בין שנת העשרים והשלשים אחרי החורבן, מספר כי צֻוָה מאת השם לקחת עמו חמשה אנשים.",
];

export default function SidebarNav() {
  const [open, setOpen] = useState<Record<number, boolean>>({ 0: true, 1: false, 2: false });
  const [sidebarVisible, setSidebarVisible] = useState(true);

  return (
    <div style={{ display: "flex", height: "100vh", background: "#fff", fontFamily: "system-ui, sans-serif", fontSize: 13, overflow: "hidden" }}>

      {/* ── Sidebar ── */}
      {sidebarVisible && (
        <aside style={{
          width: SIDEBAR_W, flexShrink: 0, borderRight: "1px solid #e5e7eb",
          background: "#f9fafb", display: "flex", flexDirection: "column", overflow: "hidden",
        }}>
          {/* Sidebar header */}
          <div style={{ padding: "12px 14px", borderBottom: "1px solid #e5e7eb" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#111827", lineHeight: 1.3 }}>
              Introductions to Tanaitic Literature
            </div>
            <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>J.N. Epstein</div>
          </div>

          {/* Top-level */}
          <div style={{ padding: "8px 8px 0" }}>
            <button
              style={{
                width: "100%", textAlign: "left", padding: "6px 10px", borderRadius: 6,
                fontSize: 12, background: "none", border: "none", cursor: "pointer",
                color: "#4b5563",
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = "#f3f4f6")}
              onMouseOut={(e) => (e.currentTarget.style.background = "none")}
            >
              Editor's Preface
            </button>
            <div style={{ height: 1, background: "#e5e7eb", margin: "8px 0" }} />
          </div>

          {/* Books */}
          <div style={{ flex: 1, overflowY: "auto", padding: "0 8px 12px" }}>
            {BOOKS.map((book, i) => (
              <div key={i} style={{ marginBottom: 4 }}>
                <button
                  onClick={() => setOpen((p) => ({ ...p, [i]: !p[i] }))}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "5px 10px", borderRadius: 6, background: "none", border: "none", cursor: "pointer",
                    fontSize: 10, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em",
                  }}
                >
                  <span style={{ textAlign: "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, paddingRight: 4 }}>
                    {book.title}
                  </span>
                  <span style={{ fontSize: 9, flexShrink: 0 }}>{open[i] ? "▼" : "▶"}</span>
                </button>
                {open[i] && (
                  <div style={{ paddingLeft: 10, borderLeft: "2px solid #e5e7eb", marginLeft: 10, marginTop: 2, marginBottom: 4 }}>
                    {book.sections.map((sec) => {
                      const active = sec === CURRENT;
                      return (
                        <button
                          key={sec}
                          style={{
                            width: "100%", textAlign: "left", padding: "5px 8px", borderRadius: 5,
                            fontSize: 12, border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                            background: active ? "#eff6ff" : "none",
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
              </div>
            ))}
          </div>
        </aside>
      )}

      {/* ── Main content ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
        {/* Header */}
        <header style={{
          borderBottom: "1px solid #e5e7eb", padding: "10px 16px",
          display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              onClick={() => setSidebarVisible((v) => !v)}
              style={{ padding: "5px 8px", borderRadius: 6, border: "1px solid #e5e7eb", background: "#fff", cursor: "pointer", fontSize: 13 }}
            >
              ☰
            </button>
            <div style={{ fontSize: 12, color: "#9ca3af", display: "flex", alignItems: "center", gap: 4 }}>
              <span>Modern Scholarship</span>
              <span>›</span>
              <span style={{ color: "#374151", fontWeight: 500 }}>Ancient Tannaitic Compilations</span>
            </div>
          </div>
          <button style={{
            padding: "5px 12px", borderRadius: 6, border: "1px solid #d1d5db", background: "#fff",
            fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, color: PRIMARY, fontWeight: 500,
          }}>
            <span>T</span> Display
          </button>
        </header>

        {/* Progress bar */}
        <div style={{ height: 2, background: "#f3f4f6", flexShrink: 0 }}>
          <div style={{ width: "34%", height: "100%", background: PRIMARY }} />
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "32px 48px" }}>
          <div style={{ maxWidth: 560, margin: "0 auto" }}>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: "#111827", marginBottom: 4 }}>
              Ancient Tannaitic Compilations
            </h1>
            <div style={{ fontSize: 16, color: "#9ca3af", marginBottom: 28, textAlign: "right", direction: "rtl" }}>
              קבצי משניות קדומים
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 24 }}>
              {PARAGRAPHS.map((_, i) => (
                <span key={i} style={{
                  fontSize: 10, padding: "2px 7px", borderRadius: 4,
                  border: `1px solid ${i === 1 ? PRIMARY : "#e5e7eb"}`,
                  color: i === 1 ? PRIMARY : "#9ca3af",
                }}>{i + 1}</span>
              ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {PARAGRAPHS.map((p, i) => (
                <div key={i} style={{ display: "flex", gap: 14 }}>
                  <span style={{ fontSize: 10, color: "#d1d5db", marginTop: 3, width: 14, textAlign: "right", flexShrink: 0 }}>
                    {i + 1}
                  </span>
                  <p style={{ flex: 1, color: "#1f2937", lineHeight: 1.8, direction: "rtl", textAlign: "right", fontFamily: "serif", margin: 0 }}>
                    {p}
                  </p>
                </div>
              ))}
            </div>

            <div style={{ borderTop: "1px solid #e5e7eb", marginTop: 40, paddingTop: 20, display: "flex", justifyContent: "space-between", fontSize: 12 }}>
              <button style={{ color: PRIMARY, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                ‹ First Mishnah
              </button>
              <button style={{ color: PRIMARY, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                Preface ›
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
