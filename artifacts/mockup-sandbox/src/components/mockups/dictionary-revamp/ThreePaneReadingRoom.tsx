import React, { useState } from "react";
import {
  Search,
  BookOpen,
  Clock,
  ExternalLink,
  ChevronRight,
  ArrowRight,
  ArrowLeft,
  Command,
} from "lucide-react";
import {
  HEBREW_LETTERS,
  AUTOSUGGEST_DAVAR,
  BDB_DAVAR,
  JASTROW_DAVAR,
  HEADWORDS_DALET,
  RECENT_LOOKUPS,
  TYPE,
  PALETTE,
} from "./_shared/mockData";

const theme = PALETTE.modern;

export function ThreePaneReadingRoom() {
  const [searchFocused, setSearchFocused] = useState(true); // default to true to show dropdown

  return (
    <div
      className="flex flex-col h-screen overflow-hidden text-sm"
      style={{
        backgroundColor: theme.bg,
        color: theme.text,
        fontFamily: TYPE.ui,
      }}
    >
      {/* TOP BAR */}
      <header
        className="flex items-center justify-between px-4 h-[52px] shrink-0 border-b"
        style={{
          backgroundColor: theme.surface,
          borderColor: theme.border,
        }}
      >
        <div className="flex items-center gap-6">
          {/* Logo */}
          <div className="flex items-center gap-2 font-semibold">
            <div
              className="w-6 h-6 rounded flex items-center justify-center text-white"
              style={{ backgroundColor: theme.accent }}
            >
              <BookOpen size={14} />
            </div>
            <span>ChavrutAI Lexicon</span>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1">
            <button
              className="px-3 py-1.5 rounded-md font-medium"
              style={{
                backgroundColor: theme.accentSoft,
                color: theme.accent,
              }}
            >
              BDB (Biblical)
            </button>
            <button
              className="px-3 py-1.5 rounded-md font-medium hover:bg-black/5"
              style={{ color: theme.textMuted }}
            >
              Jastrow (Talmudic)
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="flex-1 max-w-xl mx-auto relative">
          <div
            className="flex items-center h-9 px-3 rounded-md border shadow-sm w-full"
            style={{
              backgroundColor: theme.surface,
              borderColor: searchFocused ? theme.accent : theme.border,
              boxShadow: searchFocused ? `0 0 0 1px ${theme.accent}` : "none",
            }}
          >
            <Search size={16} style={{ color: theme.textMuted }} />
            <input
              type="text"
              className="flex-1 bg-transparent border-none outline-none px-2 font-hebrew text-base text-right"
              dir="rtl"
              defaultValue="דבר"
              style={{ color: theme.text }}
            />
            <div
              className="flex items-center gap-1 text-xs rounded px-1.5 py-0.5"
              style={{ backgroundColor: theme.surfaceAlt, color: theme.textMuted, border: `1px solid ${theme.borderStrong}` }}
            >
              <Command size={12} /> K
            </div>
          </div>

          {/* Autosuggest Dropdown */}
          {searchFocused && (
            <div
              className="absolute top-full mt-2 left-0 right-0 rounded-md border shadow-lg overflow-hidden z-50"
              style={{
                backgroundColor: theme.surface,
                borderColor: theme.border,
              }}
            >
              <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider border-b" style={{ color: theme.textMuted, borderColor: theme.border }}>
                Suggestions
              </div>
              <ul className="py-1">
                {AUTOSUGGEST_DAVAR.map((suggestion, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between px-4 py-2 hover:bg-black/5 cursor-pointer"
                    style={{
                      backgroundColor: i === 0 ? theme.surfaceAlt : "transparent",
                    }}
                  >
                    <span
                      className="text-xs uppercase px-1.5 py-0.5 rounded font-medium"
                      style={{
                        backgroundColor: "rgba(0,0,0,0.06)",
                        color: theme.textMuted,
                      }}
                    >
                      {suggestion.lexicon}
                    </span>
                    <span className="font-hebrew text-lg" dir="rtl">
                      {suggestion.voweled}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Right Nav */}
        <div className="flex items-center gap-4 text-sm font-medium" style={{ color: theme.textMuted }}>
          <button className="hover:text-black">Bookmarks</button>
          <button className="hover:text-black">History</button>
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
            <span className="text-gray-600 font-semibold">U</span>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT PANE: INDEX */}
        <aside
          className="flex h-full shrink-0 border-r"
          style={{ width: "260px", borderColor: theme.border, backgroundColor: theme.surface }}
        >
          {/* Letter Rail */}
          <div
            className="w-10 flex flex-col items-center py-2 overflow-y-auto border-r hide-scrollbar"
            style={{ borderColor: theme.border, backgroundColor: theme.surfaceAlt }}
          >
            {HEBREW_LETTERS.map((letter) => {
              const isActive = letter === "ד";
              return (
                <button
                  key={letter}
                  className={`w-8 h-8 rounded-md flex items-center justify-center font-hebrew text-base mb-1 transition-colors ${
                    isActive ? "font-bold shadow-sm" : "hover:bg-black/10"
                  }`}
                  style={{
                    backgroundColor: isActive ? theme.surface : "transparent",
                    color: isActive ? theme.accent : theme.textMuted,
                  }}
                >
                  {letter}
                </button>
              );
            })}
          </div>

          {/* Headwords List */}
          <div className="flex-1 flex flex-col overflow-hidden relative">
            <div className="px-4 py-3 border-b shrink-0 flex items-center justify-between" style={{ borderColor: theme.border }}>
              <span className="font-semibold" style={{ color: theme.textMuted }}>Letter ד</span>
              <span className="text-xs" style={{ color: theme.textMuted }}>543 entries</span>
            </div>
            <div className="flex-1 overflow-y-auto pb-12">
              {HEADWORDS_DALET.map((hw, i) => {
                const isActive = hw.voweled === "דָּבָר" && hw.lexicon === "bdb";
                return (
                  <div
                    key={i}
                    className="px-4 py-2 border-l-2 cursor-pointer flex flex-col transition-colors"
                    style={{
                      borderLeftColor: isActive ? theme.accent : "transparent",
                      backgroundColor: isActive ? theme.surfaceAlt : "transparent",
                    }}
                  >
                    <div className="flex items-baseline justify-between mb-0.5">
                      <span className="font-hebrew text-lg" dir="rtl" style={{ color: isActive ? theme.accent : theme.text }}>
                        {hw.voweled}
                      </span>
                      {hw.lexicon === "jastrow" && (
                        <span className="text-[10px] uppercase font-bold" style={{ color: theme.textMuted }}>
                          J
                        </span>
                      )}
                    </div>
                    <span className="text-xs truncate" style={{ color: theme.textMuted }}>
                      {hw.gloss}
                    </span>
                  </div>
                );
              })}
            </div>
            {/* Fade out bottom */}
            <div
              className="absolute bottom-0 left-0 right-0 h-12 pointer-events-none"
              style={{ background: `linear-gradient(to top, ${theme.surface}, transparent)` }}
            />
          </div>
        </aside>

        {/* CENTER PANE: ENTRY */}
        <main
          className="flex-1 overflow-y-auto relative"
          style={{ backgroundColor: theme.surface }}
        >
          <div className="max-w-3xl mx-auto px-10 py-12 pb-32">
            {/* Header */}
            <div className="flex items-end justify-between mb-6" dir="rtl">
              <div className="flex items-baseline gap-4">
                <h1
                  className="font-hebrew leading-none"
                  style={{ fontSize: "48px", color: theme.headword }}
                >
                  {BDB_DAVAR.headword}
                </h1>
                {BDB_DAVAR.homonym && (
                  <sup className="text-xl font-serif text-gray-400">
                    {BDB_DAVAR.homonym}
                  </sup>
                )}
                {BDB_DAVAR.pos && (
                  <span
                    className="text-sm px-2 py-1 rounded"
                    style={{ backgroundColor: theme.surfaceAlt, color: theme.textMuted }}
                  >
                    {BDB_DAVAR.pos}
                  </span>
                )}
              </div>
              <div
                className="text-lg font-serif italic"
                style={{ color: theme.textMuted }}
                dir="ltr"
              >
                da·var
              </div>
            </div>

            {/* Gloss */}
            <div className="text-xl mb-6 font-medium" style={{ color: theme.text }}>
              {BDB_DAVAR.gloss}
            </div>

            {/* Etymology Card */}
            <div
              className="p-4 rounded-lg mb-8 leading-relaxed text-[15px]"
              style={{
                backgroundColor: theme.accentSoft,
                color: theme.text,
                border: `1px solid rgba(0,0,0,0.05)`,
              }}
            >
              <span className="font-semibold" style={{ color: theme.accent }}>
                Etymology:
              </span>{" "}
              {BDB_DAVAR.etymology}
            </div>

            {/* Senses */}
            <div className="space-y-6">
              {BDB_DAVAR.senses.map((sense, i) => (
                <div key={i} className="flex gap-4">
                  <div
                    className="font-bold shrink-0 mt-0.5 text-right w-4"
                    style={{ color: theme.textMuted }}
                  >
                    {sense.label}.
                  </div>
                  <div className="flex-1">
                    <p
                      className="text-base leading-relaxed mb-2"
                      style={{ color: theme.text }}
                      dangerouslySetInnerHTML={{ __html: sense.text }}
                    />
                    {sense.refs && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {sense.refs.map((ref, j) => (
                          <span
                            key={j}
                            className="inline-flex items-center text-xs px-2 py-1 rounded-full cursor-pointer hover:opacity-80 transition-opacity"
                            style={{
                              backgroundColor: theme.surfaceAlt,
                              color: theme.accent,
                              border: `1px solid ${theme.borderStrong}`,
                            }}
                          >
                            {ref}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Pager */}
          <div
            className="absolute bottom-0 left-0 right-0 border-t py-4 px-10 flex items-center justify-between"
            style={{
              backgroundColor: "rgba(255,255,255,0.9)",
              backdropFilter: "blur(8px)",
              borderColor: theme.border,
            }}
          >
            <button className="flex items-center gap-2 hover:opacity-70 transition-opacity" style={{ color: theme.textMuted }}>
              <ArrowLeft size={16} />
              <span className="font-medium">prev:</span>
              <span className="font-hebrew text-lg">דָּבַק</span>
            </button>

            <a
              href="#"
              className="flex items-center gap-1.5 text-sm font-medium hover:underline"
              style={{ color: theme.accent }}
            >
              View on Sefaria
              <ExternalLink size={14} />
            </a>

            <button className="flex items-center gap-2 hover:opacity-70 transition-opacity" style={{ color: theme.textMuted }}>
              <span className="font-hebrew text-lg">דֶּבֶר</span>
              <span className="font-medium">:next</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </main>

        {/* RIGHT PANE: CONTEXT */}
        <aside
          className="w-[280px] h-full shrink-0 border-l overflow-y-auto"
          style={{ borderColor: theme.border, backgroundColor: theme.surfaceAlt }}
        >
          <div className="p-6 space-y-8">
            {/* Cross-References */}
            <section>
              <h3
                className="text-xs font-semibold uppercase tracking-wider mb-3"
                style={{ color: theme.textMuted }}
              >
                Cross References
              </h3>
              <div className="space-y-2">
                {BDB_DAVAR.crossRefs?.map((cr, i) => (
                  <div
                    key={i}
                    className="flex flex-col p-2.5 rounded-md bg-white border shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                    style={{ borderColor: theme.border }}
                  >
                    <div className="flex items-baseline justify-between mb-1">
                      <span className="font-hebrew text-lg" dir="rtl" style={{ color: theme.accent }}>
                        {cr.headword}
                      </span>
                      <span
                        className="text-[10px] uppercase font-bold px-1.5 rounded"
                        style={{ backgroundColor: theme.surfaceAlt, color: theme.textMuted }}
                      >
                        {cr.lexicon}
                      </span>
                    </div>
                    <span className="text-xs truncate" style={{ color: theme.textMuted }}>
                      {cr.gloss}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* Also in Jastrow Callout */}
            <section>
              <div
                className="p-4 rounded-lg flex flex-col gap-2 relative overflow-hidden"
                style={{
                  backgroundColor: theme.surface,
                  border: `1px solid ${theme.borderStrong}`,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                }}
              >
                <div
                  className="absolute top-0 right-0 w-16 h-16 opacity-5 pointer-events-none"
                  style={{ backgroundColor: theme.accent, borderRadius: "0 0 0 100%" }}
                />
                <h4 className="font-semibold text-sm" style={{ color: theme.text }}>
                  Also in Jastrow
                </h4>
                <p className="text-xs leading-relaxed" style={{ color: theme.textMuted }}>
                  Jastrow has an entry for <span className="font-hebrew text-sm" dir="rtl">{JASTROW_DAVAR.headword}</span> covering Talmudic and midrashic usage.
                </p>
                <button
                  className="mt-1 flex items-center justify-between w-full px-3 py-1.5 text-xs font-medium rounded bg-black/5 hover:bg-black/10 transition-colors"
                  style={{ color: theme.text }}
                >
                  <span>Switch to Jastrow</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </section>

            {/* Recent Lookups */}
            <section>
              <div className="flex items-center gap-1.5 mb-3" style={{ color: theme.textMuted }}>
                <Clock size={14} />
                <h3 className="text-xs font-semibold uppercase tracking-wider">
                  Recent
                </h3>
              </div>
              <ul className="space-y-1">
                {RECENT_LOOKUPS.map((rl, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between py-1.5 cursor-pointer group"
                  >
                    <div className="flex flex-col">
                      <span className="font-hebrew text-[15px] group-hover:text-black transition-colors" dir="rtl" style={{ color: theme.text }}>
                        {rl.voweled}
                      </span>
                      <span className="text-[11px] truncate w-40" style={{ color: theme.textMuted }}>
                        {rl.gloss}
                      </span>
                    </div>
                    <span
                      className="text-[9px] uppercase font-bold"
                      style={{ color: theme.textMuted }}
                    >
                      {rl.lexicon === "bdb" ? "B" : "J"}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </aside>
      </div>
    </div>
  );
}
