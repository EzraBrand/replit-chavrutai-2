import React from "react";
import { Search, Link as LinkIcon, BookOpen, ChevronLeft, ChevronRight, Bookmark } from "lucide-react";
import { BDB_DAVAR, HEBREW_LETTERS, PALETTE, TYPE } from "./_shared/mockData";

const PAL = PALETTE.manuscript;

// Convert sense index to Roman numeral
const toRoman = (num: number) => {
  const roman = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
  return roman[num - 1] || num.toString();
};

export function ManuscriptEditorial() {
  const paperTexture = `
    url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.04'/%3E%3C/svg%3E")
  `;

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: PAL.bg,
        backgroundImage: paperTexture,
        color: PAL.text,
        fontFamily: TYPE.serif,
        display: "flex",
        flexDirection: "column",
        overflowX: "hidden",
      }}
    >
      {/* Top Bar */}
      <header
        style={{
          borderBottom: `1px solid ${PAL.rule}`,
          padding: "12px 32px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: "12px", textTransform: "uppercase", letterSpacing: "0.08em", fontSize: "14px" }}>
          <span style={{ fontWeight: 700, color: PAL.accent }}>ChavrutAI</span>
          <span style={{ color: PAL.textMuted, fontSize: "12px" }}>· BDB Hebrew Lexicon</span>
        </div>
        
        <div style={{ position: "relative", width: "240px" }}>
          <Search size={14} color={PAL.textMuted} style={{ position: "absolute", left: "8px", top: "50%", transform: "translateY(-50%)" }} />
          <input 
            type="text" 
            placeholder="Search lexicon..."
            defaultValue="דבר"
            style={{
              width: "100%",
              padding: "4px 8px 4px 28px",
              backgroundColor: "transparent",
              border: "none",
              borderBottom: `1px dotted ${PAL.border}`,
              fontFamily: TYPE.serif,
              fontSize: "14px",
              color: PAL.text,
              outline: "none"
            }}
          />
        </div>
      </header>

      {/* Hebrew Letter Strip */}
      <div 
        style={{ 
          padding: "8px 32px",
          borderBottom: `1px solid ${PAL.border}`,
          display: "flex",
          justifyContent: "center",
          gap: "16px",
          fontFamily: TYPE.hebrew,
          fontSize: "18px",
          color: PAL.textMuted,
          backgroundColor: "rgba(255,255,255,0.1)",
        }}
        dir="rtl"
      >
        {HEBREW_LETTERS.map(letter => (
          <span 
            key={letter}
            style={{
              cursor: "pointer",
              color: letter === "ד" ? PAL.accent : PAL.textMuted,
              borderBottom: letter === "ד" ? `2px solid ${PAL.accent}` : "none",
              paddingBottom: "2px"
            }}
          >
            {letter}
          </span>
        ))}
      </div>

      {/* Main Content Area */}
      <main style={{ flex: 1, display: "flex", justifyContent: "center", padding: "48px 32px" }}>
        
        {/* The Page */}
        <div 
          style={{
            backgroundColor: PAL.paper,
            backgroundImage: paperTexture,
            width: "100%",
            maxWidth: "960px",
            boxShadow: "0 10px 40px -10px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05)",
            border: `1px solid ${PAL.border}`,
            padding: "48px 64px",
            position: "relative",
            display: "flex",
            flexDirection: "column"
          }}
        >
          {/* Running Header */}
          <div 
            style={{ 
              display: "flex", 
              justifyContent: "space-between",
              alignItems: "baseline",
              borderBottom: `1px solid ${PAL.border}`,
              paddingBottom: "12px",
              marginBottom: "32px",
              fontSize: "13px",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: PAL.textMuted
            }}
          >
            <div>BDB · ד · 543 — דַּי / דֶּלֶת</div>
            <div style={{ display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }}>
              folio 218 <ChevronRight size={12} />
            </div>
          </div>

          {/* Two Column Layout */}
          <div style={{ display: "flex", gap: "64px", position: "relative" }}>
            {/* Center Rule */}
            <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: "1px", backgroundColor: PAL.border, opacity: 0.5, transform: "translateX(-50%)" }} />

            {/* Left Column */}
            <div style={{ flex: 1, textAlign: "justify", position: "relative" }}>
              <div style={{ marginBottom: "24px" }}>
                <span style={{ fontFamily: TYPE.hebrew, fontSize: "36px", fontWeight: 700, color: PAL.headword, marginRight: "12px", float: "left", lineHeight: "1" }}>
                  {BDB_DAVAR.headword}
                </span>
                <span style={{ fontSize: "14px", fontVariant: "small-caps", fontStyle: "italic", marginRight: "8px" }}>{BDB_DAVAR.pos}</span>
                <span style={{ fontSize: "16px", fontStyle: "italic" }}>{BDB_DAVAR.gloss}</span>
              </div>

              <div style={{ fontSize: "14px", color: PAL.textMuted, marginBottom: "24px", lineHeight: "1.6" }}>
                {BDB_DAVAR.etymology}
              </div>

              {BDB_DAVAR.senses.slice(0, 3).map((sense, i) => (
                <div key={i} style={{ marginBottom: "16px", fontSize: "15px", lineHeight: "1.6", position: "relative" }}>
                  {/* Marginalia for first sense */}
                  {i === 0 && (
                    <div style={{ position: "absolute", right: "100%", top: "4px", paddingRight: "16px", width: "100px", textAlign: "right", fontSize: "12px", color: PAL.textMuted, fontStyle: "italic" }}>
                      Cf. <span style={{ fontFamily: TYPE.hebrew, fontStyle: "normal" }}>דָּבַר</span> vb.
                    </div>
                  )}
                  {/* Marginalia for second sense */}
                  {i === 1 && (
                    <div style={{ position: "absolute", right: "100%", top: "4px", paddingRight: "16px", width: "100px", display: "flex", justifyContent: "flex-end" }}>
                      <BookOpen size={14} color={PAL.accent} style={{ opacity: 0.6 }} />
                    </div>
                  )}
                  
                  <span style={{ display: "inline-block", width: "24px", fontVariant: "small-caps", fontWeight: 600 }}>
                    {toRoman(i + 1)}.
                  </span>
                  <span dangerouslySetInnerHTML={{ __html: sense.text.replace(/<strong>/g, `<strong style="font-weight:600; color:${PAL.text}">`).replace(/<em>/g, `<em style="font-style:italic">`) }} />
                  {' '}
                  <span style={{ color: PAL.textMuted }}>
                    (cf. {sense.refs?.map((ref, idx) => (
                      <React.Fragment key={idx}>
                        <span style={{ fontStyle: "italic", cursor: "pointer", textDecoration: "underline", textDecorationColor: "transparent", transition: "text-decoration-color 0.2s" }} 
                              onMouseEnter={(e) => e.currentTarget.style.textDecorationColor = PAL.accent}
                              onMouseLeave={(e) => e.currentTarget.style.textDecorationColor = "transparent"}>
                          {ref}
                        </span>
                        {idx < (sense.refs?.length || 0) - 1 ? ", " : ""}
                      </React.Fragment>
                    ))})
                  </span>
                </div>
              ))}
            </div>

            {/* Right Column */}
            <div style={{ flex: 1, textAlign: "justify", position: "relative" }}>
              {BDB_DAVAR.senses.slice(3).map((sense, i) => (
                <div key={i} style={{ marginBottom: "16px", fontSize: "15px", lineHeight: "1.6", position: "relative" }}>
                  <span style={{ display: "inline-block", width: "24px", fontVariant: "small-caps", fontWeight: 600 }}>
                    {toRoman(i + 4)}.
                  </span>
                  <span dangerouslySetInnerHTML={{ __html: sense.text.replace(/<strong>/g, `<strong style="font-weight:600; color:${PAL.text}">`).replace(/<em>/g, `<em style="font-style:italic">`) }} />
                  {' '}
                  <span style={{ color: PAL.textMuted }}>
                    (cf. {sense.refs?.map((ref, idx) => (
                      <React.Fragment key={idx}>
                        <span style={{ fontStyle: "italic", cursor: "pointer", textDecoration: "underline", textDecorationColor: "transparent", transition: "text-decoration-color 0.2s" }} 
                              onMouseEnter={(e) => e.currentTarget.style.textDecorationColor = PAL.accent}
                              onMouseLeave={(e) => e.currentTarget.style.textDecorationColor = "transparent"}>
                          {ref}
                        </span>
                        {idx < (sense.refs?.length || 0) - 1 ? ", " : ""}
                      </React.Fragment>
                    ))})
                  </span>
                </div>
              ))}

              <div style={{ marginTop: "32px", paddingTop: "16px", borderTop: `1px solid ${PAL.border}` }}>
                <div style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em", color: PAL.textMuted, marginBottom: "8px" }}>
                  Cross References
                </div>
                {BDB_DAVAR.crossRefs?.map((ref, idx) => (
                  <div key={idx} style={{ fontSize: "14px", marginBottom: "4px" }}>
                    <span style={{ color: PAL.textMuted, fontVariant: "small-caps", width: "60px", display: "inline-block" }}>{ref.lexicon}</span>
                    <span style={{ fontFamily: TYPE.hebrew, fontSize: "16px", color: PAL.headword, marginRight: "8px" }}>{ref.headword}</span>
                    <span style={{ fontStyle: "italic" }}>{ref.gloss}</span>
                  </div>
                ))}
              </div>
              
              {/* Decorative flourish at the end of the entry */}
              <div style={{ textAlign: "center", marginTop: "40px", color: PAL.borderStrong, fontSize: "20px" }}>
                ❦
              </div>
            </div>
          </div>
          
        </div>
      </main>

      {/* Footer Navigation */}
      <footer 
        style={{ 
          padding: "24px 32px",
          display: "flex",
          justifyContent: "center",
          gap: "32px",
          fontSize: "13px",
          color: PAL.textMuted,
          fontStyle: "italic",
          backgroundColor: PAL.bg,
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }}><ChevronLeft size={14}/> previous folio</span>
        <span>page 218 of 1,127</span>
        <span style={{ display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }}>next folio <ChevronRight size={14}/></span>
      </footer>

    </div>
  );
}
