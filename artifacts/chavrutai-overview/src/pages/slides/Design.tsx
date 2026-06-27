export default function Design() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-cream font-body">
      {/* Folio + top rule */}
      <div className="absolute top-[7vh] left-[7vw] right-[7vw] flex items-center justify-between">
        <span className="font-body text-[2.2vw] tracking-[0.4em] uppercase text-accent">
          Design Philosophy
        </span>
        <span className="font-display italic text-[2.2vw] text-muted">06</span>
      </div>
      <div className="absolute top-[12vh] left-[7vw] right-[7vw] h-px bg-border" />

      <div className="absolute top-[19vh] left-[7vw] right-[7vw] grid grid-cols-12 gap-[4vw]">
        <div className="col-span-5">
          <h2 className="font-display font-medium text-[5vw] leading-[1.04] tracking-tight text-text text-balance">
            A library, not a dashboard
          </h2>
          <p className="mt-[3vh] font-display italic text-[2.4vw] leading-snug text-primary text-pretty">
            The interface stays quiet so the text can be loud.
          </p>
        </div>

        <div className="col-span-7 flex flex-col gap-[3.2vh] self-center">
          <div className="flex items-baseline gap-[2vw] border-b border-border pb-[2.4vh]">
            <span className="font-display italic text-[2.2vw] text-muted w-[3vw]">01</span>
            <p className="font-body font-light text-[2.6vw] leading-snug text-text text-pretty">
              Typography first — hierarchy comes from weight and space, not badges or shadows.
            </p>
          </div>
          <div className="flex items-baseline gap-[2vw] border-b border-border pb-[2.4vh]">
            <span className="font-display italic text-[2.2vw] text-muted w-[3vw]">02</span>
            <p className="font-body font-light text-[2.6vw] leading-snug text-text text-pretty">
              A warm, paper-like palette — sepia, brown, and slate on parchment.
            </p>
          </div>
          <div className="flex items-baseline gap-[2vw] border-b border-border pb-[2.4vh]">
            <span className="font-display italic text-[2.2vw] text-muted w-[3vw]">03</span>
            <p className="font-body font-light text-[2.6vw] leading-snug text-text text-pretty">
              No splashy color and no decorative icons in the reading view.
            </p>
          </div>
          <div className="flex items-baseline gap-[2vw]">
            <span className="font-display italic text-[2.2vw] text-muted w-[3vw]">04</span>
            <p className="font-body font-light text-[2.6vw] leading-snug text-text text-pretty">
              A scholarly, serious tone — closer to an academic journal than an app.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
