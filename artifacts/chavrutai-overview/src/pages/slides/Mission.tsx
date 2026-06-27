export default function Mission() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg font-body">
      {/* Folio + top rule */}
      <div className="absolute top-[7vh] left-[7vw] right-[7vw] flex items-center justify-between">
        <span className="font-body text-[2.2vw] tracking-[0.4em] uppercase text-accent">
          The Mission
        </span>
        <span className="font-display italic text-[2.2vw] text-muted">02</span>
      </div>
      <div className="absolute top-[12vh] left-[7vw] right-[7vw] h-px bg-border" />

      <div className="absolute top-[20vh] left-[7vw] right-[7vw] grid grid-cols-12 gap-[4vw]">
        <div className="col-span-7">
          <h2 className="font-display font-medium text-[5.4vw] leading-[1.04] tracking-tight text-text text-balance">
            A library of fifteen centuries, made legible.
          </h2>
        </div>
        <div className="col-span-5 self-end">
          <p className="font-body font-light text-[2.6vw] leading-relaxed text-muted text-pretty">
            ChavrutAI sets the original Hebrew and Aramaic beside a clear English
            translation, so a reader can follow the argument without losing the
            thread.
          </p>
        </div>
      </div>

      {/* Lower statement band */}
      <div className="absolute left-[7vw] right-[7vw] bottom-[12vh] border-t border-border pt-[4vh] flex items-baseline justify-between gap-[4vw]">
        <p className="font-display italic text-[2.8vw] text-primary leading-snug">
          Named for the <span className="font-hebrew not-italic">חברותא</span> — the
          study partner you read alongside.
        </p>
        <span className="font-body text-[2.2vw] text-muted tracking-wide whitespace-nowrap">
          Text sourced live from Sefaria
        </span>
      </div>
    </div>
  );
}
