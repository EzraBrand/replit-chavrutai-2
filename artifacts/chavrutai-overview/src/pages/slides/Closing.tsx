export default function Closing() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bgdeep font-body">
      {/* Hebrew watermark accent */}
      <div className="absolute inset-0 flex items-center justify-start -ml-[6vw] pointer-events-none">
        <span className="font-hebrew text-[30vw] leading-none text-[#37302a] select-none">
          ת״ת
        </span>
      </div>

      {/* Top rule */}
      <div className="absolute top-[7vh] left-[7vw] right-[7vw] flex items-center justify-between">
        <span className="font-body text-[2.2vw] tracking-[0.45em] uppercase text-[#b89b7f]">
          Continue the study
        </span>
        <span className="font-display italic text-[2.2vw] text-[#b89b7f]">08</span>
      </div>
      <div className="absolute top-[12vh] left-[7vw] right-[7vw] h-px bg-[#4a4039]" />

      {/* Wordmark */}
      <div className="absolute left-[7vw] top-[34vh]">
        <h2 className="font-display font-medium text-[9vw] leading-none tracking-tight text-[#f3e9da]">
          ChavrutAI
        </h2>
        <p className="mt-[3vh] font-display italic text-[3vw] text-[#c98a52]">
          The classical Jewish library, read side by side.
        </p>
      </div>

      {/* Links */}
      <div className="absolute left-[7vw] right-[7vw] bottom-[10vh] border-t border-[#4a4039] pt-[3.5vh] flex items-center justify-between">
        <a
          href="https://chavrutai.com"
          target="_blank"
          rel="noopener noreferrer"
          className="font-body text-[2.4vw] text-[#e7dccb] tracking-wide"
        >
          chavrutai.com
        </a>
        <a
          href="https://x.com/ChavrutAI"
          target="_blank"
          rel="noopener noreferrer"
          className="font-body text-[2.4vw] text-[#e7dccb] tracking-wide"
        >
          x.com/ChavrutAI
        </a>
        <a
          href="https://github.com/EzraBrand/chavrutai"
          target="_blank"
          rel="noopener noreferrer"
          className="font-body text-[2.4vw] text-[#e7dccb] tracking-wide"
        >
          github.com/EzraBrand/chavrutai
        </a>
      </div>
    </div>
  );
}
