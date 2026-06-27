export default function Technology() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg font-body">
      {/* Folio + top rule */}
      <div className="absolute top-[7vh] left-[7vw] right-[7vw] flex items-center justify-between">
        <span className="font-body text-[2.2vw] tracking-[0.4em] uppercase text-accent">
          Technology
        </span>
        <span className="font-display italic text-[2.2vw] text-muted">07</span>
      </div>
      <div className="absolute top-[12vh] left-[7vw] right-[7vw] h-px bg-border" />

      <h2 className="absolute top-[15vh] left-[7vw] font-display font-medium text-[4.4vw] leading-tight tracking-tight text-text">
        Built on a modern, typed stack
      </h2>

      <div className="absolute left-[7vw] right-[7vw] top-[30vh] bottom-[9vh] grid grid-cols-3 gap-[3.5vw]">
        <div className="flex flex-col">
          <span className="font-display italic text-[2.4vw] text-accent">Frontend</span>
          <div className="mt-[2vh] h-px bg-border" />
          <p className="mt-[2.4vh] font-body font-light text-[2.6vw] leading-relaxed text-text">React · TypeScript</p>
          <p className="font-body font-light text-[2.6vw] leading-relaxed text-text">Vite · Wouter</p>
          <p className="font-body font-light text-[2.6vw] leading-relaxed text-text">Tailwind · shadcn/ui</p>
          <p className="font-body font-light text-[2.6vw] leading-relaxed text-text">TanStack Query</p>
        </div>

        <div className="flex flex-col">
          <span className="font-display italic text-[2.4vw] text-accent">Backend</span>
          <div className="mt-[2vh] h-px bg-border" />
          <p className="mt-[2.4vh] font-body font-light text-[2.6vw] leading-relaxed text-text">Express (Node.js)</p>
          <p className="font-body font-light text-[2.6vw] leading-relaxed text-text">Drizzle ORM</p>
          <p className="font-body font-light text-[2.6vw] leading-relaxed text-text">PostgreSQL</p>
          <p className="font-body font-light text-[2.6vw] leading-relaxed text-text">pnpm workspaces</p>
        </div>

        <div className="flex flex-col">
          <span className="font-display italic text-[2.4vw] text-accent">AI &amp; Data</span>
          <div className="mt-[2vh] h-px bg-border" />
          <p className="mt-[2.4vh] font-body font-light text-[2.6vw] leading-relaxed text-text">OpenAI SDK</p>
          <p className="font-body font-light text-[2.6vw] leading-relaxed text-text">Claude via OpenRouter</p>
          <p className="font-body font-light text-[2.6vw] leading-relaxed text-text">Sefaria API</p>
          <p className="font-body font-light text-[2.6vw] leading-relaxed text-text">PostHog analytics</p>
        </div>
      </div>
    </div>
  );
}
