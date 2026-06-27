# BDB Abbreviations Improvement Plan

## Status

| Phase | Description | Status |
|-------|-------------|--------|
| 1 | Initial mapping from Sefaria abbreviations page | ✅ Done |
| 2 | Corpus scan via `scan-lexicon-acronyms.ts` | ✅ Done |
| 3 | Add section comments to `bdb.json` + new high-frequency entries | ✅ Done |
| 4 | Map remaining high-value unmapped candidates | ✅ Done |
| 5 | Handle ambiguous single-letter tokens | ⬜ Deferred |
| 6 | Re-run corpus scan to measure coverage improvement | ⬜ Todo |

---

## Source References

- **Sefaria BDB Abbreviations page**: https://www.sefaria.org/BDB,_Abbrevations
- **Corpus scan script**: `scripts/scan-lexicon-acronyms.ts`
- **Unmapped candidates (JSON)**: `scripts/bdb-unmapped-acronyms.json` — 1,280 unique tokens (freq ≥ 2) across 9,045 headwords
- **Unmapped candidates (txt)**: `scripts/bdb-unmapped-acronyms.txt` — top 200 shown
- **Current mappings**: `shared/data/lexicon-mappings/bdb.json` — **440 real mappings** (excl. section comments)

---

## Phase 3 — New Entries Added (session 1)

The following abbreviations were newly added to `bdb.json` based on corpus scan frequency analysis:

### Scholar abbreviations (high-frequency, clearly identified)
| Token | Expansion | Corpus freq | Source evidence |
|-------|-----------|-------------|-----------------|
| `WMM` | W. Max Müller | 74 | "WMM As. u. Eur. 111" |
| `MV` | Meyer & Valeton | 138 | "Thes Ol De MV" |
| `GASm.` | G.A. Smith (George Adam Smith) | 36 | "GASm. Pf. 3 ms." |
| `BN` | Lagarde, Bildung der Nomina | 356 | "Lag BN 207 Inf." |
| `NB` | Barth, Nominalbildung | 172 | "Ba NB 149" |
| `BP` | Zimmern, Babylonische Busspsalmen | 58 | "Zim BP 117" |
| `PS` | Payne Smith, Thesaurus Syriacus | 55 | "PS 53 (AW Ges ...)" |
| `ES` | Barth, Etymologische Studien | 36 | "Ba ES 9 Schulth Lex." |
| `SG` | Nöldeke, Syrische Grammatik | 36 | "W SG 120-2" |
| `NS` | Hommel, Nordsemitische Studien | 27 | "Hom NS 100" |
| `SK` | Glaser, Skizze der Geschichte | 41 | "Gl SK ii. 280" |
| `AG` | Aramaic Grammar | 42 | "Ebers AG & BBMos." |

### Grammatical (lowercase variants / additional forms)
| Token | Expansion | Notes |
|-------|-----------|-------|
| `pf.` | perfect | lowercase complement to `Pf.` |
| `impf.` | imperfect | lowercase complement to `Impf.` |
| `imv.` | imperative | lowercase complement to `Imv.` |
| `ptcp.` | participle | complement to `Pt.` / `pt.` |
| `accus.` | accusative | long form of `acc.` |
| `genit.` | genitive | long form |
| `nom.` | nominative | |
| `masc.` | masculine | long form of `ms.` |
| `sing.` | singular | long form of `sg.` |
| `adj.gent.` | adjective gentilic | parallel to `n.pr.gent.` |
| `vb.denom.` | denominative verb | |
| `refl.` | reflexive | |
| `intr.` | intransitive | short form of `intrans.` |
| `pleon.` | pleonastic | |
| `orat.` | oratio recta (direct speech) | |
| `temp.` | temporal | |
| `techn.` | technical term | |

### Semantic/rhetorical
| Token | Expansion | Notes |
|-------|-----------|-------|
| `meton.` | metonymically | |
| `symb.` | symbolically | |
| `epith.` | epithet | |
| `concr.` | concretely | |
| `synon.` | synonymous | complement to `syn.` |

### Text-critical
| Token | Expansion | Notes |
|-------|-----------|-------|
| `crpt.` | corrupt (text critically uncertain) | freq 74 |
| `var.` | variant reading | freq 53 |
| `emend.` | emendation | freq 46 |
| `MSS` | manuscripts | freq 38 |
| `Codd.` | codices (manuscripts) | freq 86 |

### Languages & cultures
| Token | Expansion | Notes |
|-------|-----------|-------|
| `Mish.` | Mishnaic | complement to `MHeb.` |
| `Talm.` | Talmudic | freq 40 |
| `Mand.` | Mandaean | freq 66 |
| `Moab.` | Moabite | |
| `Can.` | Canaanite | freq 44 |
| `Armen.` | Armenian | freq 31 |
| `Germ.` | German | freq 72 |
| `Lat.` | Latin | freq 35 |
| `Hex.` | Hexateuch | variant with period of existing `Hex` |
| `SI` | Siloam Inscription | |

### Reference works & sources
| Token | Expansion | Notes |
|-------|-----------|-------|
| `Ant.` | Josephus, Antiquities | freq 62 |
| `Chrest.` | Hommel, Südarabische Chrestomathie | freq 66 |
| `Inschr.` | Inschriften (German: Inscriptions) | freq 34 |
| `Denkm.` | Denkmäler (Monuments/Inscriptions) | freq 62 |
| `Einl.` | Einleitung (Introduction) | freq 29 |
| `Prop.` | Gray, Studies in Hebrew Proper Names | freq 58 |
| `Dict.` | Dictionary | freq 42 |
| `Abh.` | Abhandlungen (Treatises/Papers) | freq 27 |
| `Stud.` | Studies | freq 80 |
| `Epigr.` | Epigraphy | freq 55 |
| `Intr.` | Introduction (Driver's Introduction) | freq 54 |
| `Prol.` | Prolegomena | freq 41 |
| `Mt.` | Mount | |

---

## Phase 4 — New Entries Added (session 2)

Added 40 additional mappings by sampling large BDB entries (אב, נפש, דבר, ידע, אמר, עבד) and analysing top unmapped candidates from `bdb-unmapped-acronyms.json`.

### Scholars (newly identified from entry text)
| Token | Expansion | Source evidence |
|-------|-----------|-----------------|
| `De` | Franz Delitzsch (Bible commentator) | "Ge Ew De Che Brd Di" — distinct from `Dl` (Friedrich Delitzsch) |
| `Hi` | Hitzig | "Abarb Hi Kn KueBr MP" |
| `Kn` | Knobel | "Abarb Hi Kn KueBr MP" |
| `Bae` | Baethgen | "Bae Rel 10" |
| `Bi` | Bickell | entry context |
| `Ke` | Keil | entry context |
| `Bö` | Böttcher | entry context |
| `Stu` | Studer | "Stu גֵּרִים" |
| `Bez` | Bezold | Assyrian context |
| `Lzb` | Lidzbarski | "Lzb 331 f. Cook 86" (עבד entry) |
| `Cook` | S.A. Cook | "Lzb 331 f. Cook 86" (עבד entry) |
| `Albr` | Albrecht | "Albr ZAW xvi (1896), 42" |
| `JHMordtm` | J.H. Mordtmann | "JHMordtm ZMG 1876, 37" (אמר entry) |
| `KueBr` | Kuenen & Briggs | "Abarb Hi Kn KueBr MP" |
| `Abarb` | Abarbanel (Isaac Abarbanel) | "Abarb Hi Kn KueBr MP" |
| `Lo` | Löhr | "𝔊 Lo Ew Di & Che crit. n." |
| `Dr.` | Driver | variant of `Dr` (with period) |

### Scholar works (newly identified)
| Token | Expansion | Source evidence |
|-------|-----------|-----------------|
| `Thes` | Gesenius, Thesaurus Philologicus | "De Fr MM 247 Str Prol." context |
| `G.` | Stade, Geschichte des Volkes Israel | "Sta G.1, 121 RS Sem 43" |
| `JBTh` | Jahrbücher für Biblische Theologie | "JBTh xxi. 602" |

### Grammatical / part-of-speech (new variants)
| Token | Expansion | Notes |
|-------|-----------|-------|
| `Pl.` | Plural | uppercase complement to `pl.` |
| `st.` | grammatical state | construct/absolute state contexts |
| `gent.` | gentilic | freq 67, parallel to `adj.gent.` |
| `num.` | numeral | freq 47 |
| `part.` | particle | complement to `partic.` |
| `pr.` | proper (names) | freq 40, as in "pr. names" |
| `preps.` | prepositions | freq 56 |
| `relat.` | relative | freq 39, complement to `rel.` |
| `cpd.` | compound | freq 55 |

### Qualifiers / hedges
| Token | Expansion | Notes |
|-------|-----------|-------|
| `app.` | apparently | complement to `appar.` |
| `erron.` | erroneously | freq 44 |

### Textual operations
| Token | Expansion | Notes |
|-------|-----------|-------|
| `crit.` | text-critical | freq 70 |

### Reference markers / contextual
| Token | Expansion | Notes |
|-------|-----------|-------|
| `bef.` | before | freq 63, complement to `foll.` |
| `mts.` | mountains | freq 62 |
| `wd.` | word | freq 63, as in loan-word context |
| `inhab.` | inhabitants | freq 41 |
| `Anm.` | Anmerkung (footnote/note) | freq 53, German note reference |
| `Levit.` | Levitical | freq 49 |

### Reference works
| Token | Expansion | Notes |
|-------|-----------|-------|
| `Hast.` | Hastings, Dictionary of the Bible | freq 71 |
| `Hast.DB` | Hastings, Dictionary of the Bible | freq 31 |

---

## Remaining Candidates (Phase 4 deferred)

These tokens appear in the unmapped list but require more investigation or are ambiguous:

| Token | Freq | Context | Issue |
|-------|------|---------|-------|
| `Rel.` | 62 | "Bä Rel. 156" | Always Bähr? or section of work? |
| `Proph.` | 75 | "Proph. iv. n 8" | Book/section reference vs. adjective |
| `Toy.` | 38 | "v. Toy. chief" | Crawford Howell Toy — needs confirmation |
| `JPh.` | 39 | "JPh. xiv, 127" | ✅ Already mapped as Journal of Philology |
| `Brd` | ~20 | "Ge Ew De Che Brd Di" | Could be Bäthgen, Berend, or Bredencamp — ambiguous |
| `MM` | ~15 | "De Fr MM 247" | Müller & Moehlmann? ambiguous |
| `Str` | ~30 | "Str Prol. Cr. 84" | Stracke or Strauss? unclear |

---

## Phase 5 — Deferred: Ambiguous Single-Letter Tokens

Tokens like `f.`, `m.`, `i.`, etc. require context-aware expansion (i.e., only expand when following a specific grammatical pattern). This would need changes to the `expandAbbreviations()` function in `client/src/lib/dictionary-format.ts` to support:
- Lookahead/lookbehind patterns
- Context-dependent mapping (e.g., only expand `m.` when preceded by `n.`)

---

## Phase 6 — Re-run Corpus Scan

After Phase 4 additions, re-run the corpus scan to measure coverage improvement:

```bash
npx ts-node scripts/scan-lexicon-acronyms.ts
```

Compare new `scripts/bdb-unmapped-acronyms.txt` to current baseline (1,280 unique unmapped tokens, 440 mapped entries before Phase 4).

**Expected improvement:** ~40 tokens removed from unmapped list; total mapped count: 440.

---

## JSON File Structure

`shared/data/lexicon-mappings/bdb.json` uses `//`-prefixed keys as section comments within the `mappings` object. These never match real BDB abbreviations and are safely ignored by the abbreviation expansion engine. Sections:

1. `// PROPER NAMES / GEOGRAPHY`
2. `// GRAMMATICAL — VERB FORMS`
3. `// GRAMMATICAL — STEMS`
4. `// GRAMMATICAL — NOUN & ADJECTIVE`
5. `// GRAMMATICAL — PART-OF-SPEECH LABELS`
6. `// GRAMMATICAL — SYNTAX & CLAUSES`
7. `// SEMANTIC / RHETORICAL`
8. `// QUALIFIERS & HEDGES`
9. `// TEXTUAL OPERATIONS`
10. `// REFERENCE MARKERS`
11. `// LANGUAGES — SEMITIC`
12. `// LANGUAGES — NON-SEMITIC`
13. `// TEXT-VERSIONS & SIGLA`
14. `// JOURNALS`
15. `// REFERENCE WORKS & SERIES`
16. `// SCHOLARS`
17. `// SCHOLAR WORKS`
18. `// MEDIEVAL COMMENTATORS`
19. `// SYMBOLS`

The `_metadata._tracking.sefaria_page_verified` array lists all keys confirmed against the Sefaria abbreviations page (https://www.sefaria.org/BDB,_Abbrevations).
