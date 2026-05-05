import { useState } from "react";

const PALETTE = {
  bg: "hsl(28, 37%, 94%)",
  surface: "hsl(28, 30%, 96%)",
  foreground: "hsl(25, 12%, 18%)",
  muted: "hsl(25, 8%, 42%)",
  border: "hsl(25, 18%, 80%)",
  borderStrong: "hsl(25, 18%, 68%)",
  primary: "hsl(203, 30%, 26%)",
  primaryHover: "hsl(203, 30%, 20%)",
  accent: "hsl(28, 20%, 88%)",
};

const BOOK_SECTIONS = [
  { key: "editors-preface", title: "Editor's Preface", heTitle: "דבר העורך", active: false },
  {
    key: "mishnah-tosefta",
    title: "Introduction to Mishnah and Tosefta",
    heTitle: "מבוא למשנה ולתוספתא",
    active: true,
    children: [
      { key: "preface", title: "Preface", heTitle: "פתח דבר" },
      { key: "ancient-compilations", title: "Ancient Tannaitic Compilations", heTitle: "קָבצי משניות קדומים", active: true },
      { key: "first-mishnah", title: "First Mishnah", heTitle: "משנה ראשונה" },
      { key: "remains", title: "Remains of Ancient Compilations", heTitle: "שרידי קָבצי משניות קדומים" },
      { key: "middle-gen", title: "The Mishnayot of the Middle Generation", heTitle: "משניות הביניים" },
      { key: "akiva", title: "The Mishnah of Rabbi Akiva", heTitle: "משנת ר׳ עקיבא" },
      { key: "rebbi", title: "Rebbi and His Mishnah", heTitle: "רבי ומשנתו" },
      { key: "our-mishnah", title: "Our Mishnah", heTitle: "משנתנו" },
    ]
  },
  {
    key: "tractates",
    title: "Introductions to Tractates of the Mishnah",
    heTitle: "מבואות למסכות מן המשנה",
    active: false,
    children: [
      { key: "challah", title: "Challah", heTitle: "חלה" },
      { key: "shabbat", title: "Shabbat", heTitle: "שבת" },
      { key: "eruvin", title: "Eruvin", heTitle: "עירובין" },
    ]
  },
  {
    key: "midrashim",
    title: "Introduction to Halakhic Midrashim",
    heTitle: "מבוא למדרשי הלכה",
    active: false,
  },
];

const PARAGRAPHS = [
  "אחת השאלות היסודיות בחקר המשנה היא שאלת קדמותן של קבצי משניות שקדמו למשנה שלנו. מן העובדה שכמה ממשניות התלמוד הירושלמי נבדלות ממשניות התלמוד הבבלי, ושחכמים מצטטים משניות שאינן במשנתנו – ניתן להסיק, כי לפני עריכת המשנה הסופית שלנו היו קיימים קבצי משניות שונים.",
  "ואמנם כבר ר׳ יהודה בר אלעאי מזכיר \"משנה ראשונה\" בניגוד ל\"דברי סופרים\", וכן מצינו בכמה מקומות שחכמים מביאים מימרות שאינן בנוסח המשנה שבידינו, ומחלוקות שנפתרו על ידי חכמים אחרים. מכאן ברור, שהיו לפניהם נוסחאות שונות ממשנתנו.",
  "מן הבחינה הפנימית, ניתן לזהות בגוף המשנה עצמה שכבות ספרותיות שונות. יש משניות הכתובות בסגנון ספרותי שונה לחלוטין, ויש שמכילות סתירות פנימיות שניתן להסבירן רק על ידי ההנחה שהן נכתבו בזמנים שונים ועברו עריכה חוזרת.",
  "חוקרים רבים עסקו בשאלה זו. הנוקדן הגדול של המשנה, פרופסור יעקב נחום אפשטיין, הגיע למסקנה על בסיס ניתוח ספרותי מדוקדק, שאנו יכולים לשחזר, לפחות בצורה חלקית, את הקבצים הקדומים שעמדו לפני רבי בשעת עריכת המשנה הסופית.",
  "הראיות הבולטות ביותר לקיומם של קבצי משניות קדומים הן: (א) שינויי לשון וסגנון בתוך אותה מסכת; (ב) מחלוקות עקרוניות שלא ניתן לפתרן אלא בהנחת מקורות שונים; (ג) כפילויות וחזרות שאין להן הסבר ספרותי אחד; (ד) עדויות מפורשות של אמוראים על קיום נוסחאות קדומות.",
  "נוסף על כך, גנזי קהיר גילו קטעי גניזה המכילים נוסחאות שונות ממשנתנו, ואף מצינו בפירוש רש\"י ובתוספות הפנייה לנוסחאות אחרות. כל אלה מחזקים את ההשערה כי המשנה שלנו אינה המסמך הראשוני, אלא תוצר של עריכה ממושכת.",
];

export function BookReader() {
  const [navOpen, setNavOpen] = useState(true);
  const [expandedBooks, setExpandedBooks] = useState<string[]>(["mishnah-tosefta"]);

  const toggleBook = (key: string) => {
    setExpandedBooks(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  return (
    <div style={{ fontFamily: "'Georgia', serif", backgroundColor: PALETTE.bg, color: PALETTE.foreground, minHeight: "100vh", display: "flex", flexDirection: "column" }}>

      {/* Header */}
      <header style={{ height: "52px", backgroundColor: PALETTE.surface, borderBottom: `1px solid ${PALETTE.border}`, display: "flex", alignItems: "center", padding: "0 20px", position: "sticky", top: 0, zIndex: 20, gap: "0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: PALETTE.muted, fontFamily: "system-ui, sans-serif" }}>
          <span style={{ color: PALETTE.primary, cursor: "pointer" }}>ChavrutAI</span>
          <span style={{ color: PALETTE.border }}>›</span>
          <span style={{ color: PALETTE.primary, cursor: "pointer" }}>Scholarship</span>
          <span style={{ color: PALETTE.border }}>›</span>
          <span style={{ color: PALETTE.primary, cursor: "pointer" }}>Introductions to Tanaitic Literature</span>
          <span style={{ color: PALETTE.border }}>›</span>
          <span style={{ color: PALETTE.foreground, fontWeight: 500 }}>Ancient Tannaitic Compilations</span>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: "16px", alignItems: "center" }}>
          <button
            onClick={() => setNavOpen(!navOpen)}
            style={{ fontSize: "12px", color: PALETTE.primary, background: "none", border: "none", cursor: "pointer", fontFamily: "system-ui, sans-serif", padding: "4px 0" }}
          >
            {navOpen ? "Hide contents" : "Show contents"}
          </button>
        </div>
      </header>

      <div style={{ display: "flex", flex: 1 }}>

        {/* Sidebar TOC */}
        {navOpen && (
          <aside style={{ width: "260px", flexShrink: 0, borderRight: `1px solid ${PALETTE.border}`, backgroundColor: PALETTE.surface, overflowY: "auto", position: "sticky", top: "52px", maxHeight: "calc(100vh - 52px)", fontFamily: "system-ui, sans-serif" }}>
            <div style={{ padding: "20px 0" }}>
              <div style={{ padding: "0 16px 12px", fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: PALETTE.muted }}>
                Contents
              </div>
              {BOOK_SECTIONS.map(section => (
                <div key={section.key}>
                  <button
                    onClick={() => section.children && toggleBook(section.key)}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "8px 16px",
                      background: "none",
                      border: "none",
                      cursor: section.children ? "pointer" : "default",
                      fontSize: "13px",
                      color: section.active ? PALETTE.primary : PALETTE.foreground,
                      fontWeight: section.active ? 600 : 400,
                      lineHeight: "1.4",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "6px",
                    }}
                  >
                    {section.children && (
                      <span style={{ marginTop: "2px", fontSize: "10px", color: PALETTE.muted, flexShrink: 0 }}>
                        {expandedBooks.includes(section.key) ? "▾" : "▸"}
                      </span>
                    )}
                    <span>{section.title}</span>
                  </button>

                  {section.children && expandedBooks.includes(section.key) && (
                    <div style={{ paddingLeft: "8px" }}>
                      {section.children.map(child => (
                        <button
                          key={child.key}
                          style={{
                            width: "100%",
                            textAlign: "left",
                            padding: "6px 16px 6px 22px",
                            background: child.active ? PALETTE.accent : "none",
                            border: "none",
                            cursor: "pointer",
                            fontSize: "12.5px",
                            color: child.active ? PALETTE.primary : PALETTE.muted,
                            fontWeight: child.active ? 600 : 400,
                            lineHeight: "1.4",
                            borderLeft: child.active ? `2px solid ${PALETTE.primary}` : "2px solid transparent",
                            marginLeft: "16px",
                          }}
                        >
                          {child.title}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </aside>
        )}

        {/* Main reading area */}
        <main style={{ flex: 1, overflowY: "auto", padding: "48px 0" }}>
          <div style={{ maxWidth: "680px", margin: "0 auto", padding: "0 40px" }}>

            {/* Section heading */}
            <div style={{ marginBottom: "36px" }}>
              <div style={{ fontSize: "12px", color: PALETTE.muted, fontFamily: "system-ui, sans-serif", marginBottom: "8px", letterSpacing: "0.04em" }}>
                Introduction to Mishnah and Tosefta
              </div>
              <h1 style={{ fontSize: "26px", fontWeight: 600, lineHeight: "1.3", marginBottom: "8px", color: PALETTE.foreground }}>
                Ancient Tannaitic Compilations
              </h1>
              <div style={{ fontSize: "20px", fontWeight: 500, color: PALETTE.muted, direction: "rtl", textAlign: "right", fontFamily: "'SBL Hebrew', 'Frank Ruhl Libre', 'David', serif", lineHeight: "1.6" }}>
                קָבצי משניות קדומים
              </div>
            </div>

            {/* Jump anchors */}
            <div style={{ display: "flex", gap: "6px", marginBottom: "32px", flexWrap: "wrap", fontFamily: "system-ui, sans-serif" }}>
              {PARAGRAPHS.map((_, i) => (
                <a key={i} href={`#p${i + 1}`} style={{ fontSize: "12px", color: PALETTE.primary, padding: "3px 8px", border: `1px solid ${PALETTE.border}`, borderRadius: "4px", textDecoration: "none", backgroundColor: PALETTE.surface }}>
                  {i + 1}
                </a>
              ))}
            </div>

            {/* Paragraphs */}
            {PARAGRAPHS.map((para, i) => (
              <div key={i} id={`p${i + 1}`} style={{ marginBottom: "28px", scrollMarginTop: "80px" }}>
                <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
                  <span style={{ fontSize: "11px", color: PALETTE.border, fontFamily: "system-ui, sans-serif", marginTop: "6px", flexShrink: 0, width: "16px", textAlign: "right" }}>
                    {i + 1}
                  </span>
                  <p style={{
                    direction: "rtl",
                    textAlign: "right",
                    fontSize: "18px",
                    lineHeight: "1.85",
                    fontFamily: "'SBL Hebrew', 'Frank Ruhl Libre', 'David', serif",
                    color: PALETTE.foreground,
                    margin: 0,
                    flex: 1,
                  }}>
                    {para}
                  </p>
                </div>
              </div>
            ))}

            {/* Section navigation */}
            <div style={{ borderTop: `1px solid ${PALETTE.border}`, marginTop: "48px", paddingTop: "24px", display: "flex", justifyContent: "space-between", fontFamily: "system-ui, sans-serif" }}>
              <button style={{ background: "none", border: `1px solid ${PALETTE.border}`, color: PALETTE.primary, fontSize: "13px", padding: "8px 16px", borderRadius: "4px", cursor: "pointer" }}>
                ← Preface
              </button>
              <a href="#" style={{ fontSize: "12px", color: PALETTE.muted, alignSelf: "center", textDecoration: "none" }}>
                Sefaria source
              </a>
              <button style={{ background: "none", border: `1px solid ${PALETTE.border}`, color: PALETTE.primary, fontSize: "13px", padding: "8px 16px", borderRadius: "4px", cursor: "pointer" }}>
                First Mishnah →
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
