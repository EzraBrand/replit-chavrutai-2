import React, { useState } from "react";
import { Search, Maximize2, Rows, Columns, PanelLeft, PanelRight, ExternalLink, ChevronRight, BookOpen } from "lucide-react";
import {
  BDB_DAVAR,
  JASTROW_DAVAR,
  AUTOSUGGEST_DAVAR,
  HEADWORDS_DALET,
  PALETTE,
  TYPE,
  type DictEntry,
  type Sense
} from "./_shared/mockData";

export function BilingualCompare() {
  const [searchFocused, setSearchFocused] = useState(false);
  const [viewMode, setViewMode] = useState<"side-by-side" | "stacked" | "bdb-only" | "jastrow-only">("side-by-side");

  // A unified gloss for DAVAR
  const sharedGloss = "speech, word, matter, thing / thing, command, affair";

  // Related roots for the scroll strip
  const relatedRoots = HEADWORDS_DALET.filter(h => h.voweled.startsWith("דב") || h.voweled.startsWith("דּב"));

  return (
    <div style={{ 
      fontFamily: TYPE.ui, 
      backgroundColor: PALETTE.modern.bg, 
      color: PALETTE.modern.text,
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column"
    }}>
      {/* Header */}
      <header style={{
        height: "64px",
        backgroundColor: PALETTE.modern.surface,
        borderBottom: `1px solid ${PALETTE.modern.border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        position: "sticky",
        top: 0,
        zIndex: 10
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "32px",
            height: "32px",
            borderRadius: "6px",
            backgroundColor: PALETTE.modern.accent,
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <BookOpen size={18} />
          </div>
          <span style={{ fontWeight: 600, fontSize: "18px", letterSpacing: "-0.02em" }}>ChavrutAI Lexicon</span>
        </div>

        {/* Search */}
        <div style={{ position: "relative", width: "480px" }}>
          <div style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            backgroundColor: searchFocused ? PALETTE.modern.surface : PALETTE.modern.bg,
            border: `1px solid ${searchFocused ? PALETTE.modern.accent : PALETTE.modern.borderStrong}`,
            borderRadius: "8px",
            padding: "0 12px",
            height: "40px",
            boxShadow: searchFocused ? "0 4px 12px rgba(0,0,0,0.05)" : "none",
            transition: "all 0.2s ease"
          }}>
            <Search size={16} color={PALETTE.modern.textMuted} />
            <input
              type="text"
              defaultValue="דָּבָר"
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
              style={{
                border: "none",
                background: "transparent",
                outline: "none",
                width: "100%",
                padding: "0 12px",
                fontSize: "16px",
                fontFamily: TYPE.hebrew,
                direction: "rtl"
              }}
            />
          </div>

          {/* Autosuggest Dropdown */}
          {searchFocused && (
            <div style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              marginTop: "8px",
              backgroundColor: PALETTE.modern.surface,
              border: `1px solid ${PALETTE.modern.border}`,
              borderRadius: "8px",
              boxShadow: "0 12px 24px rgba(0,0,0,0.1)",
              overflow: "hidden"
            }}>
              {AUTOSUGGEST_DAVAR.map((item, i) => (
                <div key={i} style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 16px",
                  borderBottom: i < AUTOSUGGEST_DAVAR.length - 1 ? `1px solid ${PALETTE.modern.border}` : "none",
                  cursor: "pointer",
                  backgroundColor: item.voweled === "דָּבָר" ? PALETTE.modern.bg : "transparent"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ 
                      fontSize: "10px", 
                      fontWeight: 600, 
                      textTransform: "uppercase", 
                      padding: "2px 6px", 
                      borderRadius: "4px",
                      backgroundColor: item.lexicon === "bdb" ? "rgba(37, 99, 235, 0.1)" : "rgba(217, 119, 6, 0.1)",
                      color: item.lexicon === "bdb" ? "rgb(37, 99, 235)" : "rgb(217, 119, 6)"
                    }}>
                      {item.lexicon}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                    <span style={{ color: PALETTE.modern.textMuted, fontSize: "14px", fontFamily: TYPE.hebrew }}>{item.unvoweled}</span>
                    <span style={{ fontFamily: TYPE.hebrew, fontSize: "18px", fontWeight: item.voweled === "דָּבָר" ? 700 : 400 }} dir="rtl">{item.voweled}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* View Toggles */}
        <div style={{ display: "flex", backgroundColor: PALETTE.modern.bg, borderRadius: "6px", padding: "4px", border: `1px solid ${PALETTE.modern.border}` }}>
          {[
            { id: "side-by-side", icon: Columns, title: "Side-by-side" },
            { id: "stacked", icon: Rows, title: "Stacked" },
            { id: "bdb-only", icon: PanelLeft, title: "BDB Only" },
            { id: "jastrow-only", icon: PanelRight, title: "Jastrow Only" }
          ].map(btn => (
            <button
              key={btn.id}
              onClick={() => setViewMode(btn.id as any)}
              title={btn.title}
              style={{
                width: "32px",
                height: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "4px",
                border: "none",
                background: viewMode === btn.id ? PALETTE.modern.surface : "transparent",
                color: viewMode === btn.id ? PALETTE.modern.text : PALETTE.modern.textMuted,
                boxShadow: viewMode === btn.id ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                cursor: "pointer"
              }}
            >
              <btn.icon size={16} strokeWidth={viewMode === btn.id ? 2.5 : 2} />
            </button>
          ))}
        </div>
      </header>

      {/* Headword Section */}
      <div style={{
        height: "140px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 24px",
        borderBottom: `1px solid ${PALETTE.modern.borderStrong}`
      }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: "16px", marginBottom: "8px" }}>
          <span style={{ fontSize: "12px", color: PALETTE.modern.textMuted, display: "flex", gap: "8px" }}>
            <span>Found in:</span>
            <span style={{ color: "rgb(37, 99, 235)", fontWeight: 600 }}>BDB ✓</span>
            <span style={{ color: "rgb(217, 119, 6)", fontWeight: 600 }}>Jastrow ✓</span>
          </span>
        </div>
        
        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          <h1 style={{
            fontFamily: TYPE.hebrew,
            fontSize: "56px",
            fontWeight: 700,
            margin: 0,
            lineHeight: 1,
            color: PALETTE.modern.headword,
            direction: "rtl"
          }}>
            {BDB_DAVAR.headword}
          </h1>
        </div>
        <p style={{ fontSize: "16px", color: PALETTE.modern.textMuted, marginTop: "12px", fontStyle: "italic" }}>
          {sharedGloss}
        </p>

        {/* Related roots strip */}
        <div style={{
          display: "flex",
          gap: "8px",
          marginTop: "16px",
          maxWidth: "100%",
          overflowX: "auto",
          paddingBottom: "8px"
        }}>
          {relatedRoots.map((root, i) => (
            <div key={i} style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 12px",
              backgroundColor: PALETTE.modern.surface,
              border: `1px solid ${PALETTE.modern.border}`,
              borderRadius: "16px",
              fontSize: "13px",
              whiteSpace: "nowrap",
              cursor: "pointer"
            }}>
              <span style={{ fontFamily: TYPE.hebrew, fontSize: "16px", fontWeight: 500, direction: "rtl" }}>{root.voweled}</span>
              <span style={{ color: PALETTE.modern.textMuted }}>{root.gloss.substring(0, 15)}{root.gloss.length > 15 ? '...' : ''}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Dictionary Comparison Columns */}
      <div style={{
        display: "flex",
        flexDirection: viewMode === "stacked" ? "column" : "row",
        flex: 1,
        maxWidth: "1400px",
        margin: "0 auto",
        width: "100%",
        padding: "24px",
        gap: "24px"
      }}>
        {/* BDB Column */}
        {(viewMode === "side-by-side" || viewMode === "stacked" || viewMode === "bdb-only") && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <div style={{
              backgroundColor: PALETTE.modern.surface,
              borderTop: "4px solid rgb(37, 99, 235)",
              borderRadius: "8px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
              overflow: "hidden",
              height: "100%"
            }}>
              <div style={{
                padding: "16px 24px",
                borderBottom: `1px solid ${PALETTE.modern.border}`,
                backgroundColor: "rgba(37, 99, 235, 0.03)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "rgb(37, 99, 235)" }}>BDB</h2>
                  <div style={{ fontSize: "12px", color: PALETTE.modern.textMuted, marginTop: "2px" }}>Biblical Hebrew (1906)</div>
                </div>
                <a href={`https://www.sefaria.org/${BDB_DAVAR.sefariaSlug}`} style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "12px",
                  color: "rgb(37, 99, 235)",
                  textDecoration: "none",
                  fontWeight: 500
                }}>
                  View on Sefaria <ExternalLink size={12} />
                </a>
              </div>

              <div style={{ padding: "24px" }}>
                <div style={{
                  padding: "12px 16px",
                  backgroundColor: PALETTE.modern.bg,
                  borderRadius: "6px",
                  borderLeft: "3px solid rgb(37, 99, 235)",
                  marginBottom: "32px",
                  fontSize: "14px",
                  lineHeight: 1.6
                }}>
                  <strong style={{ color: PALETTE.modern.textMuted, fontSize: "12px", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>Etymology</strong>
                  <span dangerouslySetInnerHTML={{ __html: BDB_DAVAR.etymology || "" }} />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                  {BDB_DAVAR.senses.map((sense, i) => (
                    <SenseRow key={i} sense={sense} accentColor="rgb(37, 99, 235)" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Jastrow Column */}
        {(viewMode === "side-by-side" || viewMode === "stacked" || viewMode === "jastrow-only") && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <div style={{
              backgroundColor: PALETTE.modern.surface,
              borderTop: "4px solid rgb(217, 119, 6)",
              borderRadius: "8px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
              overflow: "hidden",
              height: "100%"
            }}>
              <div style={{
                padding: "16px 24px",
                borderBottom: `1px solid ${PALETTE.modern.border}`,
                backgroundColor: "rgba(217, 119, 6, 0.03)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "rgb(217, 119, 6)" }}>Jastrow</h2>
                  <div style={{ fontSize: "12px", color: PALETTE.modern.textMuted, marginTop: "2px" }}>Talmudic Hebrew & Aramaic (1903)</div>
                </div>
                <a href={`https://www.sefaria.org/${JASTROW_DAVAR.sefariaSlug}`} style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "12px",
                  color: "rgb(217, 119, 6)",
                  textDecoration: "none",
                  fontWeight: 500
                }}>
                  View on Sefaria <ExternalLink size={12} />
                </a>
              </div>

              <div style={{ padding: "24px" }}>
                <div style={{
                  padding: "12px 16px",
                  backgroundColor: PALETTE.modern.bg,
                  borderRadius: "6px",
                  borderLeft: "3px solid rgb(217, 119, 6)",
                  marginBottom: "32px",
                  fontSize: "14px",
                  lineHeight: 1.6
                }}>
                  <strong style={{ color: PALETTE.modern.textMuted, fontSize: "12px", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>Etymology</strong>
                  <span dangerouslySetInnerHTML={{ __html: JASTROW_DAVAR.etymology || "" }} />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                  {JASTROW_DAVAR.senses.map((sense, i) => (
                    <SenseRow key={i} sense={sense} accentColor="rgb(217, 119, 6)" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SenseRow({ sense, accentColor }: { sense: Sense, accentColor: string }) {
  return (
    <div style={{ display: "flex", gap: "16px" }}>
      <div style={{
        width: "28px",
        height: "28px",
        borderRadius: "50%",
        backgroundColor: `${accentColor}15`,
        color: accentColor,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "14px",
        fontWeight: 700,
        flexShrink: 0
      }}>
        {sense.label}
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ margin: "0 0 12px 0", fontSize: "15px", lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: sense.text }} />
        {sense.refs && sense.refs.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {sense.refs.map((ref, idx) => (
              <span key={idx} style={{
                fontSize: "12px",
                color: accentColor,
                backgroundColor: `${accentColor}08`,
                padding: "2px 8px",
                borderRadius: "12px",
                cursor: "pointer",
                fontWeight: 500,
                border: `1px solid ${accentColor}20`
              }}>
                {ref}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
