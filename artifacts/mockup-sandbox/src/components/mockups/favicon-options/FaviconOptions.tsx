// Favicon design options for Bekiut — each shown at 96px, 32px, and 16px
// plus a simulated browser tab, so legibility at tiny sizes is visible.

import type * as React from "react";

const NAVY = "#1b4a6e";
const CREAM = "#f7f1e8";
const GOLD = "#c9a35c";
const SERIF = "Frank Ruhl Libre, Noto Serif Hebrew, David Libre, serif";

type Variant = {
  id: string;
  name: string;
  note: string;
  svg: (size: number) => React.JSX.Element;
};

const variants: Variant[] = [
  {
    id: "current",
    name: "Current",
    note: "Baseline — navy square, cream ב.",
    svg: (s) => (
      <svg width={s} height={s} viewBox="0 0 512 512">
        <rect width="512" height="512" rx="72" fill={NAVY} />
        <text x="256" y="278" textAnchor="middle" dominantBaseline="central" fontFamily={SERIF} fontSize="360" fill={CREAM}>ב</text>
      </svg>
    ),
  },
  {
    id: "gold-accent",
    name: "Gold Accent",
    note: "ב in manuscript gold — warmer, more distinctive in a tab row.",
    svg: (s) => (
      <svg width={s} height={s} viewBox="0 0 512 512">
        <rect width="512" height="512" rx="72" fill={NAVY} />
        <text x="256" y="278" textAnchor="middle" dominantBaseline="central" fontFamily={SERIF} fontSize="360" fill={GOLD}>ב</text>
      </svg>
    ),
  },
  {
    id: "keyline",
    name: "Keyline Frame",
    note: "Thin gold inner border — echoes a printed page frame.",
    svg: (s) => (
      <svg width={s} height={s} viewBox="0 0 512 512">
        <rect width="512" height="512" rx="72" fill={NAVY} />
        <rect x="42" y="42" width="428" height="428" rx="44" fill="none" stroke={GOLD} strokeWidth="14" />
        <text x="256" y="278" textAnchor="middle" dominantBaseline="central" fontFamily={SERIF} fontSize="300" fill={CREAM}>ב</text>
      </svg>
    ),
  },
  {
    id: "daf",
    name: "Daf Motif",
    note: "ב flanked by 'commentary' rules — a nod to the Talmud page layout.",
    svg: (s) => (
      <svg width={s} height={s} viewBox="0 0 512 512">
        <rect width="512" height="512" rx="72" fill={NAVY} />
        {[150, 210, 270, 330].map((y) => (
          <g key={y}>
            <rect x="56" y={y} width="88" height="18" rx="9" fill={CREAM} opacity="0.55" />
            <rect x="368" y={y} width="88" height="18" rx="9" fill={CREAM} opacity="0.55" />
          </g>
        ))}
        <text x="256" y="268" textAnchor="middle" dominantBaseline="central" fontFamily={SERIF} fontSize="280" fill={CREAM}>ב</text>
      </svg>
    ),
  },
  {
    id: "inverted",
    name: "Parchment",
    note: "Inverted — cream background, navy ב, gold baseline stroke.",
    svg: (s) => (
      <svg width={s} height={s} viewBox="0 0 512 512">
        <rect width="512" height="512" rx="72" fill={CREAM} />
        <text x="256" y="262" textAnchor="middle" dominantBaseline="central" fontFamily={SERIF} fontSize="330" fill={NAVY}>ב</text>
        <rect x="120" y="418" width="272" height="22" rx="11" fill={GOLD} />
      </svg>
    ),
  },
  {
    id: "book",
    name: "Open Book",
    note: "ב sitting on an open-book silhouette — study, not just a letter.",
    svg: (s) => (
      <svg width={s} height={s} viewBox="0 0 512 512">
        <rect width="512" height="512" rx="72" fill={NAVY} />
        <path d="M76 372 Q166 336 256 372 Q346 336 436 372 L436 412 Q346 376 256 412 Q166 376 76 412 Z" fill={GOLD} />
        <text x="256" y="216" textAnchor="middle" dominantBaseline="central" fontFamily={SERIF} fontSize="270" fill={CREAM}>ב</text>
      </svg>
    ),
  },
  {
    id: "circle",
    name: "Round Seal",
    note: "Circular badge with keyline — reads like a scholarly seal / stamp.",
    svg: (s) => (
      <svg width={s} height={s} viewBox="0 0 512 512">
        <circle cx="256" cy="256" r="256" fill={NAVY} />
        <circle cx="256" cy="256" r="212" fill="none" stroke={GOLD} strokeWidth="14" />
        <text x="256" y="272" textAnchor="middle" dominantBaseline="central" fontFamily={SERIF} fontSize="270" fill={CREAM}>ב</text>
      </svg>
    ),
  },
  {
    id: "gradient",
    name: "Deep Gradient",
    note: "Subtle navy→ink gradient + gold ב — more depth, still quiet.",
    svg: (s) => (
      <svg width={s} height={s} viewBox="0 0 512 512">
        <defs>
          <linearGradient id={`g-${s}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#2a6491" />
            <stop offset="100%" stopColor="#122f47" />
          </linearGradient>
        </defs>
        <rect width="512" height="512" rx="72" fill={`url(#g-${s})`} />
        <text x="256" y="278" textAnchor="middle" dominantBaseline="central" fontFamily={SERIF} fontSize="360" fill={GOLD}>ב</text>
      </svg>
    ),
  },
];

function TabSim({ v }: { v: Variant }) {
  return (
    <div className="flex items-center gap-2 rounded-t-lg border border-b-0 border-stone-300 bg-stone-100 px-3 py-1.5 w-44">
      <div className="shrink-0">{v.svg(16)}</div>
      <span className="truncate text-xs text-stone-700">Bekiut — Berakhot 2a</span>
      <span className="ml-auto text-stone-400 text-xs">×</span>
    </div>
  );
}

export function FaviconOptions() {
  return (
    <div className="min-h-screen bg-[#faf6ef] p-10" style={{ fontFamily: "Georgia, serif" }}>
      <h1 className="text-2xl font-semibold text-[#1b4a6e]">Bekiut Favicon Options</h1>
      <p className="mt-1 mb-8 text-sm text-stone-600">
        Each option at 96 px, 32 px, 16 px, and in a simulated browser tab. The 16 px cell is the one that matters most.
      </p>
      <div className="grid grid-cols-2 gap-6">
        {variants.map((v) => (
          <div key={v.id} className="rounded-lg border border-stone-300 bg-white p-6">
            <div className="flex items-baseline justify-between">
              <h2 className="font-semibold text-stone-800">{v.name}</h2>
              {v.id === "current" && (
                <span className="text-[10px] uppercase tracking-wide text-stone-400">baseline</span>
              )}
            </div>
            <p className="mt-1 mb-4 text-xs text-stone-500 min-h-8">{v.note}</p>
            <div className="flex items-end gap-6">
              {v.svg(96)}
              {v.svg(32)}
              {v.svg(16)}
              <div className="ml-auto">
                <TabSim v={v} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
