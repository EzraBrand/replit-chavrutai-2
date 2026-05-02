import React from 'react';
import { ArrowLeft, ChevronDown, Search, Bookmark, Volume2, ExternalLink, Library } from 'lucide-react';
import { JASTROW_DAVAR, RECENT_LOOKUPS, TYPE, PALETTE } from './_shared/mockData';

export function ConcordanceCards() {
  const entry = JASTROW_DAVAR;

  return (
    <div
      style={{
        backgroundColor: PALETTE.modern.bg,
        color: PALETTE.modern.text,
        fontFamily: TYPE.ui,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* HEADER */}
      <header
        style={{
          height: '56px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          backgroundColor: PALETTE.modern.surface,
          borderBottom: `1px solid ${PALETTE.modern.border}`,
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'none',
              border: 'none',
              color: PALETTE.modern.textMuted,
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            <ArrowLeft size={16} />
            Back
          </button>
          
          <div style={{ width: '1px', height: '24px', backgroundColor: PALETTE.modern.border }} />

          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'none',
              border: 'none',
              color: PALETTE.modern.text,
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600,
            }}
          >
            Lexicon: Jastrow <ChevronDown size={14} color={PALETTE.modern.textMuted} />
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            style={{
              background: 'none',
              border: 'none',
              color: PALETTE.modern.textMuted,
              cursor: 'pointer',
            }}
          >
            <Search size={20} />
          </button>
          <button
            style={{
              background: 'none',
              border: 'none',
              color: PALETTE.modern.textMuted,
              cursor: 'pointer',
            }}
          >
            <Bookmark size={20} />
          </button>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main
        style={{
          flex: 1,
          padding: '48px 24px 120px 24px', // Extra bottom padding for recent strip
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <div style={{ width: '100%', maxWidth: '720px' }}>
          
          {/* HERO SECTION */}
          <section
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              marginBottom: '64px',
            }}
          >
            <div
              style={{
                fontSize: '12px',
                color: PALETTE.modern.textMuted,
                fontWeight: 500,
                letterSpacing: '0.05em',
                marginBottom: '24px',
                textTransform: 'uppercase',
              }}
            >
              1 / 5,287 in ד
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '16px',
              }}
            >
              <span
                style={{
                  backgroundColor: PALETTE.modern.surfaceAlt,
                  color: PALETTE.modern.text,
                  padding: '4px 8px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 600,
                  border: `1px solid ${PALETTE.modern.border}`,
                }}
              >
                {entry.pos}
              </span>
              <button
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  border: `1px solid ${PALETTE.modern.border}`,
                  backgroundColor: PALETTE.modern.surface,
                  color: PALETTE.modern.text,
                  cursor: 'pointer',
                }}
                title="Listen to pronunciation"
              >
                <Volume2 size={14} />
              </button>
              <button
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  border: `1px solid ${PALETTE.modern.border}`,
                  backgroundColor: PALETTE.modern.surface,
                  color: PALETTE.modern.text,
                  cursor: 'pointer',
                }}
                title="Open in Sefaria"
              >
                <ExternalLink size={14} />
              </button>
            </div>

            <h1
              style={{
                fontFamily: TYPE.hebrew,
                fontSize: '96px',
                lineHeight: 1.1,
                color: PALETTE.modern.headword,
                margin: '0 0 16px 0',
                direction: 'rtl',
              }}
            >
              {entry.headword}
            </h1>

            <div
              style={{
                fontSize: '22px',
                color: PALETTE.modern.text,
                fontWeight: 500,
                marginBottom: '8px',
              }}
            >
              "{entry.gloss}"
            </div>
            
            <a
              href="#"
              style={{
                fontSize: '14px',
                color: PALETTE.modern.accent,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                marginBottom: '24px',
                fontWeight: 500,
              }}
            >
              also in BDB <ArrowLeft size={14} style={{ transform: 'rotate(180deg)' }} />
            </a>

            {entry.etymology && (
              <div
                style={{
                  backgroundColor: PALETTE.modern.surface,
                  border: `1px solid ${PALETTE.modern.border}`,
                  padding: '8px 16px',
                  borderRadius: '999px',
                  fontSize: '14px',
                  color: PALETTE.modern.textMuted,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Library size={14} />
                <span dangerouslySetInnerHTML={{ __html: entry.etymology }} />
              </div>
            )}
          </section>

          {/* SENSES SECTION */}
          <section style={{ marginBottom: '48px' }}>
            <div
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: PALETTE.modern.textMuted,
                letterSpacing: '0.05em',
                marginBottom: '20px',
                textTransform: 'uppercase',
              }}
            >
              Senses
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {entry.senses.map((sense, idx) => (
                <div
                  key={idx}
                  style={{
                    backgroundColor: PALETTE.modern.surface,
                    borderRadius: '16px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                    border: `1px solid ${PALETTE.modern.border}`,
                    display: 'flex',
                    overflow: 'hidden',
                  }}
                >
                  {/* Label Column */}
                  <div
                    style={{
                      width: '48px',
                      backgroundColor: PALETTE.modern.surfaceAlt,
                      borderRight: `1px solid ${PALETTE.modern.borderStrong}`,
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'center',
                      paddingTop: '20px',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: TYPE.sans,
                        fontSize: '13px',
                        fontWeight: 700,
                        color: PALETTE.modern.accent,
                      }}
                    >
                      {sense.label?.padStart(2, '0') || String(idx + 1).padStart(2, '0')}
                    </span>
                  </div>

                  {/* Body Column */}
                  <div style={{ flex: 1, padding: '20px 24px' }}>
                    <div
                      style={{
                        fontSize: '16px',
                        lineHeight: 1.6,
                        color: PALETTE.modern.text,
                        marginBottom: sense.refs && sense.refs.length > 0 ? '16px' : '0',
                      }}
                      dangerouslySetInnerHTML={{ __html: sense.text }}
                    />

                    {sense.refs && sense.refs.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {sense.refs.map((ref, rIdx) => (
                          <button
                            key={rIdx}
                            style={{
                              backgroundColor: PALETTE.modern.surface,
                              border: `1px solid ${PALETTE.modern.borderStrong}`,
                              padding: '4px 10px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: 500,
                              color: PALETTE.modern.textMuted,
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              outline: rIdx === 0 ? `2px solid ${PALETTE.modern.accentSoft}` : 'none',
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.borderColor = PALETTE.modern.accent;
                              e.currentTarget.style.color = PALETTE.modern.accent;
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.borderColor = PALETTE.modern.borderStrong;
                              e.currentTarget.style.color = PALETTE.modern.textMuted;
                            }}
                          >
                            {ref}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* RELATED SECTION */}
          {entry.crossRefs && entry.crossRefs.length > 0 && (
            <section>
              <div
                style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: PALETTE.modern.textMuted,
                  letterSpacing: '0.05em',
                  marginBottom: '16px',
                  textTransform: 'uppercase',
                }}
              >
                Related
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                {entry.crossRefs.map((ref, idx) => (
                  <button
                    key={idx}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      backgroundColor: PALETTE.modern.surfaceAlt,
                      border: `1px solid ${PALETTE.modern.border}`,
                      borderRadius: '12px',
                      padding: '12px 16px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      minWidth: '140px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <span
                        style={{
                          fontFamily: TYPE.hebrew,
                          fontSize: '18px',
                          fontWeight: 700,
                          color: PALETTE.modern.headword,
                          direction: 'rtl',
                        }}
                      >
                        {ref.headword}
                      </span>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          color: ref.lexicon === 'jastrow' ? '#d97706' : '#2563eb', // amber for jastrow, blue for bdb
                          backgroundColor: 'rgba(0,0,0,0.05)',
                          padding: '2px 4px',
                          borderRadius: '4px',
                        }}
                      >
                        {ref.lexicon === 'jastrow' ? 'JAST' : 'BDB'}
                      </span>
                    </div>
                    <span style={{ fontSize: '13px', color: PALETTE.modern.textMuted }}>
                      {ref.gloss}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      {/* RECENT LOOKUPS BOTTOM STRIP */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: '64px',
          backgroundColor: PALETTE.modern.surface,
          borderTop: `1px solid ${PALETTE.modern.border}`,
          boxShadow: '0 -4px 12px rgba(0,0,0,0.02)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
          zIndex: 20,
          overflowX: 'auto',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', margin: '0 auto', maxWidth: '1200px' }}>
          <span
            style={{
              fontSize: '12px',
              fontWeight: 600,
              color: PALETTE.modern.textMuted,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              whiteSpace: 'nowrap',
            }}
          >
            Recent Lookups
          </span>
          <div style={{ width: '1px', height: '24px', backgroundColor: PALETTE.modern.border }} />
          
          <div style={{ display: 'flex', gap: '12px' }}>
            {RECENT_LOOKUPS.map((lookup, idx) => (
              <button
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: PALETTE.modern.surfaceAlt,
                  border: `1px solid ${PALETTE.modern.border}`,
                  padding: '6px 14px',
                  borderRadius: '999px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: lookup.lexicon === 'jastrow' ? '#d97706' : '#2563eb',
                  }}
                  title={lookup.lexicon}
                />
                <span
                  style={{
                    fontFamily: TYPE.hebrew,
                    fontSize: '15px',
                    fontWeight: 600,
                    direction: 'rtl',
                    color: PALETTE.modern.text,
                  }}
                >
                  {lookup.voweled}
                </span>
                <span style={{ fontSize: '12px', color: PALETTE.modern.textMuted }}>
                  {lookup.gloss}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
