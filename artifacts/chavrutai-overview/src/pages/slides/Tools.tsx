export default function Tools() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg font-body">
      {/* Folio + top rule */}
      <div className="absolute top-[7vh] left-[7vw] right-[7vw] flex items-center justify-between">
        <span className="font-body text-[2.2vw] tracking-[0.4em] uppercase text-accent">
          Study Tools
        </span>
        <span className="font-display italic text-[2.2vw] text-muted">05</span>
      </div>
      <div className="absolute top-[12vh] left-[7vw] right-[7vw] h-px bg-border" />

      <h2 className="absolute top-[15vh] left-[7vw] right-[7vw] font-display font-medium text-[4.4vw] leading-tight tracking-tight text-text">
        Reference and inquiry, built in
      </h2>

      {/* Three columns */}
      <div className="absolute left-[7vw] right-[7vw] top-[30vh] bottom-[10vh] grid grid-cols-3 gap-[3.5vw]">
        <div className="border-t-2 border-accent pt-[3vh] flex flex-col">
          <span className="font-display italic text-[2.2vw] text-muted">i.</span>
          <h3 className="mt-[1vh] font-display text-[3.1vw] leading-tight text-text">Lexicons</h3>
          <p className="mt-[2.5vh] font-body font-light text-[2.6vw] leading-relaxed text-muted text-pretty">
            The Jastrow dictionary of the Talmud and the BDB lexicon of Biblical
            Hebrew, searchable and linked from the text itself.
          </p>
        </div>

        <div className="border-t-2 border-accent pt-[3vh] flex flex-col">
          <span className="font-display italic text-[2.2vw] text-muted">ii.</span>
          <h3 className="mt-[1vh] font-display text-[3.1vw] leading-tight text-text">Study companion</h3>
          <p className="mt-[2.5vh] font-body font-light text-[2.6vw] leading-relaxed text-muted text-pretty">
            An AI chat partner, powered by Claude, for asking questions about a
            passage and following an argument as it unfolds.
          </p>
        </div>

        <div className="border-t-2 border-accent pt-[3vh] flex flex-col">
          <span className="font-display italic text-[2.2vw] text-muted">iii.</span>
          <h3 className="mt-[1vh] font-display text-[3.1vw] leading-tight text-text">Search</h3>
          <p className="mt-[2.5vh] font-body font-light text-[2.6vw] leading-relaxed text-muted text-pretty">
            Full-text search across the corpora, plus a study feed and
            scholarship works for wider reading and context.
          </p>
        </div>
      </div>
    </div>
  );
}
