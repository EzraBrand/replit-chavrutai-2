import { useState } from "react";

const PALETTE = {
  bg: "hsl(28, 37%, 94%)",
  surface: "hsl(28, 30%, 96%)",
  commentaryBg: "hsl(28, 22%, 91%)",
  foreground: "hsl(25, 12%, 18%)",
  muted: "hsl(25, 8%, 42%)",
  border: "hsl(25, 18%, 80%)",
  borderStrong: "hsl(25, 18%, 65%)",
  primary: "hsl(203, 30%, 26%)",
};

const MISHNAYOT = [
  {
    num: 1,
    heText: "כָּל שֶׁהוּא חַיָּב בַּחַלָּה, חַיָּב בַּבִּכּוּרִים, וּלְקַח לוֹ לָקַח מִן הָאָרֶץ לְבַת יִשְׂרָאֵל – חַיָּב בַּחַלָּה וּפָטוּר מִן הַבִּכּוּרִים.",
    enText: "Whoever is subject to the obligation of challah is subject to the obligation of first fruits. If a non-Jew acquired land from an Israelite woman – he is subject to challah but exempt from first fruits.",
    commentary: [
      "משנה זו עוסקת ביחס בין שתי מצוות: חלה ובכורים. ניסוח זה של \"כל שהוא חייב\" הוא ניסוח עקרוני האופייני לסגנון המשנה כאשר היא מבקשת לכלול כלל כולל.",
      "הביטוי \"לקח לו\" – כלומר נכרי שרכש קרקע ביישראל – מציג מצב ביניים מעניין. המשנה קובעת: חיוב בחלה קיים (כי החיוב תלוי בגידול הדגן בארץ), אך פטור מבכורים (כי הבכורים תלויים בבעלות ישראלית על הארץ).",
      "חידוש הלכתי זה משקף את הבנת חז\"ל את הטעם שמאחורי כל מצוה. חלה היא מצות קמח – מה שנקצר מן הארץ. בכורים הם מצות ארץ ישראל בידי ישראל. האבחנה ברורה ועמוקה.",
    ]
  },
  {
    num: 2,
    heText: "הַגַּר וְהָעֶבֶד, חַיָּבִין בַּחַלָּה. הַנָּכְרִי וְהַכּוּתִי, פְּטוּרִים מִן הַחַלָּה.",
    enText: "The convert and the slave are obligated in challah. The non-Jew and the Samaritan are exempt from challah.",
    commentary: [
      "ברשימה הקצרה הזו נידון מעמדם של ארבע קבוצות ביחס לחיוב חלה. הגר – כלומר הגר שנתגייר – חייב בכל המצוות כישראל גמור, ולכן חייב בחלה.",
      "העבד הכנעני מיוחד: הוא חצי עבד חצי בן חורין, אך בית הדין קבע שחייב במצוות שהאשה חייבת בהן. חלה היא ממצוות עשה שלא הזמן גרמא, ולכן חייב.",
      "הכותי – הוא השומרוני – פטור. זו הלכה מיוחדת שנקבעה לאחר ש\"עשאום כגויים\". ענין הכותים מורכב בתלמוד ובמשנה, ומשנה זו משקפת תקופה שלאחר ניתוק הקשרים ההלכתיים עמהם.",
    ]
  },
  {
    num: 3,
    heText: "הָעִסָּה שֶׁנַּעֲשֵׂית בְּמֵי פֵרוֹת, חַיֶּבֶת בַּחַלָּה, וְנֶאֱכֶלֶת בְּיָדַיִם מְסוֹאָבוֹת.",
    enText: "Dough that was made with fruit juice is subject to challah and may be eaten with unwashed hands.",
    commentary: [
      "משנה מפתיעה זו מכניסה שני עקרונות: (א) מי פירות אינם ממיימים את הקמח לעניין טומאה, ולכן עיסה כזו אינה מקבלת טומאה ממים; (ב) אף על פי כן, חייבת בחלה.",
      "הלכה זו מבטאת את הכלל שחיוב חלה אינו תלוי בטומאה וטהרה אלא בעצם לישת הקמח לשם אפיה. כיוון שמי פירות מחשיבים את הבצק כ\"עיסה\" לעניין אפיה – חייב.",
      "הכינוי \"ידיים מסואבות\" הוא טכני: ידיים שניים (שנטמאו בגוף ראשון של טומאה). בגלל שמי פירות אינם מכשירים לטומאה, העיסה אינה נטמאת מנגיעת ידיים כאלה.",
    ]
  },
];

export function CommentaryReader() {
  const [activeSection, setActiveSection] = useState<number | null>(null);

  return (
    <div style={{ fontFamily: "'Georgia', serif", backgroundColor: PALETTE.bg, color: PALETTE.foreground, minHeight: "100vh", display: "flex", flexDirection: "column" }}>

      {/* Header */}
      <header style={{ height: "52px", backgroundColor: PALETTE.surface, borderBottom: `1px solid ${PALETTE.border}`, display: "flex", alignItems: "center", padding: "0 20px", position: "sticky", top: 0, zIndex: 20, gap: "0", fontFamily: "system-ui, sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: PALETTE.muted }}>
          <span style={{ color: PALETTE.primary, cursor: "pointer" }}>ChavrutAI</span>
          <span style={{ color: PALETTE.border }}>›</span>
          <span style={{ color: PALETTE.primary, cursor: "pointer" }}>Scholarship</span>
          <span style={{ color: PALETTE.border }}>›</span>
          <span style={{ color: PALETTE.primary, cursor: "pointer" }}>Mishnat Eretz Yisrael on Challah</span>
          <span style={{ color: PALETTE.border }}>›</span>
          <span style={{ color: PALETTE.foreground, fontWeight: 500 }}>Chapter 1</span>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: "20px", fontSize: "13px", color: PALETTE.muted }}>
          <span>Ch. 1 / 4</span>
        </div>
      </header>

      {/* Chapter heading */}
      <div style={{ borderBottom: `1px solid ${PALETTE.border}`, backgroundColor: PALETTE.surface, padding: "20px 40px" }}>
        <div style={{ maxWidth: "780px", margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div>
              <div style={{ fontSize: "11px", fontFamily: "system-ui, sans-serif", color: PALETTE.muted, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "6px" }}>
                Mishnat Eretz Yisrael · Modern Commentary
              </div>
              <h1 style={{ fontSize: "22px", fontWeight: 600, margin: 0, lineHeight: "1.3" }}>
                Mishnah Challah — Chapter 1
              </h1>
            </div>
            <div style={{ textAlign: "right", direction: "rtl", fontFamily: "'SBL Hebrew', 'Frank Ruhl Libre', serif" }}>
              <div style={{ fontSize: "11px", fontFamily: "system-ui, sans-serif", color: PALETTE.muted, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "6px", direction: "ltr" }}>
                &nbsp;
              </div>
              <div style={{ fontSize: "20px", color: PALETTE.muted }}>משנת ארץ ישראל על חלה</div>
            </div>
          </div>

          {/* Jump to mishnah */}
          <div style={{ display: "flex", gap: "6px", marginTop: "14px", alignItems: "center", fontFamily: "system-ui, sans-serif" }}>
            <span style={{ fontSize: "11px", color: PALETTE.muted, marginRight: "2px" }}>Jump to:</span>
            {MISHNAYOT.map(m => (
              <a key={m.num} href={`#m${m.num}`} style={{ fontSize: "12px", color: PALETTE.primary, padding: "2px 8px", border: `1px solid ${PALETTE.border}`, borderRadius: "3px", textDecoration: "none", backgroundColor: PALETTE.bg }}>
                {m.num}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Mishnayot */}
      <main style={{ flex: 1, padding: "32px 40px" }}>
        <div style={{ maxWidth: "780px", margin: "0 auto" }}>
          {MISHNAYOT.map((m, mi) => (
            <div key={m.num} id={`m${m.num}`} style={{ marginBottom: "40px", scrollMarginTop: "70px" }}>

              {/* Mishnah label */}
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px", fontFamily: "system-ui, sans-serif" }}>
                <span style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: PALETTE.muted }}>
                  Mishnah {m.num}
                </span>
                <div style={{ flex: 1, height: "1px", backgroundColor: PALETTE.border }} />
              </div>

              {/* Mishnah text block */}
              <div style={{ border: `1px solid ${PALETTE.border}`, borderRadius: "6px", overflow: "hidden", backgroundColor: PALETTE.surface }}>
                {/* Hebrew */}
                <div style={{ padding: "16px 20px", borderBottom: `1px solid ${PALETTE.border}` }}>
                  <p style={{
                    direction: "rtl",
                    textAlign: "right",
                    fontSize: "19px",
                    lineHeight: "1.9",
                    fontFamily: "'SBL Hebrew', 'Frank Ruhl Libre', 'David', serif",
                    margin: 0,
                    color: PALETTE.foreground,
                  }}>
                    {m.heText}
                  </p>
                </div>
                {/* English */}
                <div style={{ padding: "14px 20px" }}>
                  <p style={{
                    fontSize: "14px",
                    lineHeight: "1.7",
                    fontFamily: "system-ui, sans-serif",
                    margin: 0,
                    color: PALETTE.muted,
                    fontStyle: "italic",
                  }}>
                    {m.enText}
                  </p>
                </div>
              </div>

              {/* Commentary */}
              <div style={{ marginTop: "2px", borderLeft: `3px solid ${PALETTE.borderStrong}`, marginLeft: "8px" }}>
                <div style={{ backgroundColor: PALETTE.commentaryBg, borderRadius: "0 6px 6px 0", padding: "18px 20px 18px 20px" }}>
                  <div style={{ fontSize: "10.5px", fontFamily: "system-ui, sans-serif", color: PALETTE.muted, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: "12px", fontWeight: 600 }}>
                    Commentary · Mishnat Eretz Yisrael
                  </div>
                  {m.commentary.map((para, pi) => (
                    <p key={pi} style={{
                      direction: "rtl",
                      textAlign: "right",
                      fontSize: "16px",
                      lineHeight: "1.85",
                      fontFamily: "'SBL Hebrew', 'Frank Ruhl Libre', 'David', serif",
                      margin: 0,
                      marginBottom: pi < m.commentary.length - 1 ? "16px" : 0,
                      color: PALETTE.foreground,
                    }}>
                      {para}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {/* Chapter navigation */}
          <div style={{ borderTop: `1px solid ${PALETTE.border}`, paddingTop: "24px", display: "flex", justifyContent: "space-between", fontFamily: "system-ui, sans-serif" }}>
            <button style={{ background: "none", border: `1px solid ${PALETTE.border}`, color: PALETTE.muted, fontSize: "13px", padding: "8px 16px", borderRadius: "4px", cursor: "not-allowed", opacity: 0.5 }}>
              ← Introduction
            </button>
            <a href="#" style={{ fontSize: "12px", color: PALETTE.muted, alignSelf: "center", textDecoration: "none" }}>
              Sefaria source
            </a>
            <button style={{ background: "none", border: `1px solid ${PALETTE.border}`, color: PALETTE.primary, fontSize: "13px", padding: "8px 16px", borderRadius: "4px", cursor: "pointer" }}>
              Chapter 2 →
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
