const base = import.meta.env.BASE_URL;

export default function Reading() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg font-body">
      {/* Folio + top rule */}
      <div className="absolute top-[7vh] left-[7vw] right-[7vw] flex items-center justify-between">
        <span className="font-body text-[2.2vw] tracking-[0.4em] uppercase text-accent">
          The Reading Experience
        </span>
        <span className="font-display italic text-[2.2vw] text-muted">04</span>
      </div>
      <div className="absolute top-[12vh] left-[7vw] right-[7vw] h-px bg-border" />

      {/* Screenshot panel */}
      <div className="absolute top-[18vh] left-[7vw] w-[44vw] bottom-[10vh] bg-panel border border-border p-[1.2vw] flex items-center justify-center">
        <img
          src={`${base}talmud-page-screenshot.png`}
          crossOrigin="anonymous"
          alt="ChavrutAI Talmud reading view with Hebrew and English side by side"
          className="max-w-full max-h-full object-contain"
        />
      </div>

      {/* Right column */}
      <div className="absolute top-[18vh] left-[55vw] right-[7vw] bottom-[8vh] flex flex-col justify-center">
        <h2 className="font-display font-medium text-[3.9vw] leading-[1.05] tracking-tight text-text text-balance">
          Two languages, one page
        </h2>

        <div className="mt-[3vh] flex flex-col gap-[2.4vh]">
          <div>
            <p className="font-display text-[2.6vw] text-primary leading-tight">Sectioned bilingual display</p>
            <p className="font-body font-light text-[2.4vw] text-muted leading-snug">Hebrew and Aramaic aligned with English, passage by passage.</p>
          </div>
          <div>
            <p className="font-display text-[2.6vw] text-primary leading-tight">Reference panel</p>
            <p className="font-body font-light text-[2.4vw] text-muted leading-snug">Cited Bible verses surface in place, without leaving the text.</p>
          </div>
          <div>
            <p className="font-display text-[2.6vw] text-primary leading-tight">Term highlighting</p>
            <p className="font-body font-light text-[2.4vw] text-muted leading-snug">Names, places, and concepts marked with a light, quiet tint.</p>
          </div>
          <div>
            <p className="font-display text-[2.6vw] text-primary leading-tight">Daf Yomi</p>
            <p className="font-body font-light text-[2.4vw] text-muted leading-snug">The daily page of Talmud, ready to open each morning.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
