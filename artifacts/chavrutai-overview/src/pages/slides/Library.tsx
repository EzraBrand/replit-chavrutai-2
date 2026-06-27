export default function Library() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg font-body">
      {/* Folio + top rule */}
      <div className="absolute top-[7vh] left-[7vw] right-[7vw] flex items-center justify-between">
        <span className="font-body text-[2.2vw] tracking-[0.4em] uppercase text-accent">
          The Library
        </span>
        <span className="font-display italic text-[2.2vw] text-muted">03</span>
      </div>
      <div className="absolute top-[12vh] left-[7vw] right-[7vw] h-px bg-border" />

      <h2 className="absolute top-[15vh] left-[7vw] font-display font-medium text-[4.4vw] leading-tight tracking-tight text-text">
        Five corpora, one reading surface
      </h2>

      {/* Rows */}
      <div className="absolute left-[7vw] right-[7vw] bottom-[8vh] top-[28vh] flex flex-col justify-between">
        <div className="flex items-baseline justify-between border-b border-border pb-[1.4vh]">
          <div className="flex items-baseline gap-[2vw]">
            <span className="font-display text-[3vw] text-text w-[26vw]">Babylonian Talmud</span>
            <span className="font-hebrew text-[2.6vw] text-primary">תלמוד בבלי</span>
          </div>
          <span className="font-body font-light text-[2.4vw] text-muted">37 tractates · 5,400+ folio pages</span>
        </div>

        <div className="flex items-baseline justify-between border-b border-border pb-[1.4vh]">
          <div className="flex items-baseline gap-[2vw]">
            <span className="font-display text-[3vw] text-text w-[26vw]">Jerusalem Talmud</span>
            <span className="font-hebrew text-[2.6vw] text-primary">תלמוד ירושלמי</span>
          </div>
          <span className="font-body font-light text-[2.4vw] text-muted">The Yerushalmi, by chapter and halakhah</span>
        </div>

        <div className="flex items-baseline justify-between border-b border-border pb-[1.4vh]">
          <div className="flex items-baseline gap-[2vw]">
            <span className="font-display text-[3vw] text-text w-[26vw]">Mishnah</span>
            <span className="font-hebrew text-[2.6vw] text-primary">משנה</span>
          </div>
          <span className="font-body font-light text-[2.4vw] text-muted">Standalone tractates without Gemara</span>
        </div>

        <div className="flex items-baseline justify-between border-b border-border pb-[1.4vh]">
          <div className="flex items-baseline gap-[2vw]">
            <span className="font-display text-[3vw] text-text w-[26vw]">Tanakh</span>
            <span className="font-hebrew text-[2.6vw] text-primary">תנ״ך</span>
          </div>
          <span className="font-body font-light text-[2.4vw] text-muted">The Hebrew Bible, 24 books</span>
        </div>

        <div className="flex items-baseline justify-between border-b border-border pb-[1.4vh]">
          <div className="flex items-baseline gap-[2vw]">
            <span className="font-display text-[3vw] text-text w-[26vw]">Mishneh Torah</span>
            <span className="font-hebrew text-[2.6vw] text-primary">משנה תורה</span>
          </div>
          <span className="font-body font-light text-[2.4vw] text-muted">Rambam's legal code, 14 books</span>
        </div>
      </div>
    </div>
  );
}
