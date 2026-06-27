export default function Cover() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bgdeep font-body">
      {/* Hebrew watermark accent */}
      <div className="absolute inset-0 flex items-center justify-end pr-[4vw] pointer-events-none">
        <span className="font-hebrew text-[34vw] leading-none text-[#3a322c] select-none">
          חברותא
        </span>
      </div>

      {/* Folio + top rule */}
      <div className="absolute top-[7vh] left-[7vw] right-[7vw] flex items-center justify-between">
        <span className="font-body text-[2.2vw] tracking-[0.45em] uppercase text-[#b89b7f]">
          A Study Platform
        </span>
        <span className="font-display italic text-[2.2vw] text-[#b89b7f]">01</span>
      </div>
      <div className="absolute top-[12vh] left-[7vw] right-[7vw] h-px bg-[#4a4039]" />

      {/* Main lockup */}
      <div className="absolute left-[7vw] bottom-[18vh] max-w-[72vw]">
        <h1 className="font-display font-medium text-[12vw] leading-[0.92] tracking-tight text-[#f3e9da]">
          ChavrutAI
        </h1>
        <p className="mt-[3vh] font-display italic text-[3.4vw] leading-snug text-[#c98a52] text-balance">
          The classical Jewish library, read side by side.
        </p>
      </div>

      {/* Bottom caption */}
      <div className="absolute bottom-[7vh] left-[7vw] right-[7vw] flex items-center justify-between">
        <span className="font-body text-[2.2vw] text-[#9c8a78] tracking-wide">
          Bilingual Hebrew–English · Talmud · Mishnah · Tanakh · Rambam
        </span>
      </div>
    </div>
  );
}
