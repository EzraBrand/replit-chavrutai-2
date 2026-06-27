import { jsPDF } from "jspdf";
import fs from "fs";

const MARGIN = 36;
const PAGE_W = 612;
const PAGE_H = 792;
const CONTENT_W = PAGE_W - 2 * MARGIN;
const CONTENT_H = PAGE_H - 2 * MARGIN;
const DATE = "April 2, 2026";

const COLORS = {
  navy: [20, 40, 80],
  darkText: [30, 30, 30],
  body: [50, 50, 50],
  accent: [120, 80, 40],
  lightBg: [245, 240, 232],
  white: [255, 255, 255],
  green: [34, 120, 60],
  red: [180, 40, 40],
  gray: [120, 120, 120],
  headerBg: [35, 55, 95],
  rowAlt: [248, 245, 240],
  border: [200, 190, 175],
};

let doc;
let y;
let pageNum = 0;
let isNewPage = false;

function newPage() {
  if (isNewPage) return;
  doc.addPage();
  pageNum++;
  y = MARGIN;
  isNewPage = true;
  addFooter();
}

function checkSpace(needed) {
  if (y + needed > PAGE_H - MARGIN - 20) {
    newPage();
  }
}

function addFooter() {
  const savedY = y;
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.gray);
  doc.text(`ChavrutAI Competitive Analysis — ${DATE}`, MARGIN, PAGE_H - 15);
  doc.text(`Page ${pageNum}`, PAGE_W - MARGIN, PAGE_H - 15, { align: "right" });
  doc.setDrawColor(...COLORS.border);
  doc.line(MARGIN, PAGE_H - 25, PAGE_W - MARGIN, PAGE_H - 25);
  y = savedY;
}

function setColor(color) {
  doc.setTextColor(...color);
}

function heading(text, size, color) {
  checkSpace(size + 20);
  isNewPage = false;
  doc.setFontSize(size);
  doc.setFont("helvetica", "bold");
  setColor(color || COLORS.navy);
  doc.text(text, MARGIN, y);
  y += size * 0.5 + 8;
}

function subheading(text) {
  checkSpace(30);
  isNewPage = false;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  setColor(COLORS.accent);
  doc.text(text, MARGIN, y);
  y += 16;
}

function bodyText(text, indent) {
  isNewPage = false;
  doc.setFontSize(9.5);
  doc.setFont("helvetica", "normal");
  setColor(COLORS.body);
  const x = MARGIN + (indent || 0);
  const maxW = CONTENT_W - (indent || 0);
  const lines = doc.splitTextToSize(text, maxW);
  for (const line of lines) {
    checkSpace(14);
    doc.text(line, x, y);
    y += 13;
  }
  y += 3;
}

function bulletPoint(text, indent) {
  isNewPage = false;
  const x = MARGIN + (indent || 10);
  doc.setFontSize(9.5);
  doc.setFont("helvetica", "normal");
  setColor(COLORS.body);
  doc.text("•", x - 8, y);
  const lines = doc.splitTextToSize(text, CONTENT_W - (indent || 10) - 5);
  for (let i = 0; i < lines.length; i++) {
    checkSpace(14);
    doc.text(lines[i], x, y);
    y += 13;
  }
  y += 2;
}

function drawTableRow(cols, colWidths, x0, rowY, isHeader, isAlt) {
  const rowH = 22;
  if (isHeader) {
    doc.setFillColor(...COLORS.headerBg);
    doc.rect(x0, rowY - 14, colWidths.reduce((a, b) => a + b, 0), rowH, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
  } else {
    if (isAlt) {
      doc.setFillColor(...COLORS.rowAlt);
      doc.rect(x0, rowY - 14, colWidths.reduce((a, b) => a + b, 0), rowH, "F");
    }
    doc.setTextColor(...COLORS.darkText);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
  }
  let cx = x0;
  for (let i = 0; i < cols.length; i++) {
    const cellText = String(cols[i] || "");
    const lines = doc.splitTextToSize(cellText, colWidths[i] - 6);
    doc.text(lines[0] || "", cx + 3, rowY - 2);
    cx += colWidths[i];
  }
  return rowH;
}

function drawTable(headers, rows, colWidths) {
  const totalW = colWidths.reduce((a, b) => a + b, 0);
  checkSpace(25 + rows.length * 22);

  let rowY = y;
  const hdrH = drawTableRow(headers, colWidths, MARGIN, rowY, true, false);
  rowY += hdrH;

  for (let r = 0; r < rows.length; r++) {
    checkSpace(24);
    rowY = y + (r === 0 ? hdrH : 0);
    if (r === 0) rowY = y;
    const rH = drawTableRow(rows[r], colWidths, MARGIN, y, false, r % 2 === 1);
    y += rH;
  }
  y += 8;
}

function generatePDF() {
  doc = new jsPDF({ unit: "pt", format: "letter" });
  pageNum = 1;
  isNewPage = true;

  // === PAGE 1: TITLE + EXECUTIVE SUMMARY ===
  y = MARGIN;
  addFooter();

  // Title block
  doc.setFillColor(...COLORS.navy);
  doc.rect(0, 0, PAGE_W, 180, "F");

  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("Competitive Analysis", MARGIN, 70);

  doc.setFontSize(16);
  doc.setFont("helvetica", "normal");
  doc.text("ChavrutAI — Digital Jewish Text Study Platform", MARGIN, 100);

  doc.setFontSize(10);
  doc.text(DATE, MARGIN, 130);

  doc.setFontSize(9);
  doc.text("Category: Jewish EdTech / Digital Text Study", MARGIN, 150);

  y = 210;
  isNewPage = false;

  heading("Executive Summary", 16);
  y += 4;

  subheading("Positioning Statement");
  bodyText(
    "For Jewish learners of all levels — from yeshiva students to adult beginners — who want to study Talmud, Mishnah, and Bible with modern tools, ChavrutAI is a digital study platform that combines clean bilingual text reading with AI-powered chavruta (study partner) capabilities. Unlike Sefaria, which offers a vast but unguided library, or Chabad.org, which filters content through a denominational lens, ChavrutAI provides a focused, scholarly reading experience enhanced by artificial intelligence — replicating the traditional chavruta learning model in a digital format."
  );

  y += 5;
  subheading("Top 3 Strategic Recommendations");

  bulletPoint(
    "1. OWN THE AI CHAVRUTA NICHE: ChavrutAI's AI study partner is its strongest differentiator. No major competitor has deeply integrated AI into the core text-reading experience. Double down on this — make the AI contextually aware of what the user is reading, not just a generic chatbot.",
    10
  );
  bulletPoint(
    "2. FOCUS ON TALMUD DEPTH OVER LIBRARY BREADTH: Sefaria has 50M+ words and 775K monthly users. Competing on library size is futile. Instead, make ChavrutAI the best Talmud-specific reading experience — superior text display, better navigation, integrated dictionary, and AI explanations that Sefaria can't match.",
    10
  );
  bulletPoint(
    '3. TARGET THE "OVERWHELMED BEGINNER" SEGMENT: Sefaria\'s power is also its weakness — it\'s overwhelming for new learners. Chabad.org is too denominationally specific. Position ChavrutAI as the accessible on-ramp to serious Jewish text study, with AI guidance that meets learners where they are.',
    10
  );

  // === PAGE 2: COMPETITIVE LANDSCAPE ===
  newPage();
  isNewPage = false;

  heading("Competitive Landscape", 16);
  y += 4;

  bodyText(
    "The Jewish digital text study market has five primary players, ranging from well-funded nonprofits to niche AI startups. Below is a summary of each competitor's positioning, strengths, and vulnerabilities."
  );
  y += 5;

  const landscapeHeaders = [
    "Competitor",
    "Type",
    "Pricing",
    "Key Strength",
    "Key Weakness",
  ];
  const landscapeWidths = [95, 80, 65, 150, 150];
  const landscapeRows = [
    [
      "Sefaria",
      "Nonprofit, open-source",
      "Free",
      "Massive library (50M+ words), open API, 775K users/mo",
      "Overwhelming UI for beginners; no guided learning or AI study partner",
    ],
    [
      "Chabad.org",
      "Religious org",
      "Free",
      "Rich multimedia (video, audio), daily study, 8 languages",
      "Denominational lens (Chabad/Lubavitch); limited text study tools",
    ],
    [
      "Al HaTorah",
      "Nonprofit",
      "Free",
      "Deep Tanakh focus, 40+ commentators, customizable views",
      "Tanakh-only scope; dated MediaWiki design; small team",
    ],
    [
      "AllDaf (OU)",
      "Nonprofit",
      "Free",
      "Curated shiurim library, video content, OU brand",
      "Daf Yomi only; no AI; content consumption not interactive study",
    ],
    [
      "JewPT",
      "Startup",
      "Free",
      "AI-first approach; accessible Q&A format",
      "No text reader; hallucination risk; no original content",
    ],
  ];

  drawTable(landscapeHeaders, landscapeRows, landscapeWidths);

  y += 10;
  subheading("Funding & Scale Context");

  bulletPoint(
    "Sefaria: 501(c)(3) nonprofit. 18 engineers on staff. Funded by major Jewish philanthropies (Jim Joseph Foundation, AVI CHAI). 200+ third-party apps built on their API. The 800-lb gorilla of this space.",
    10
  );
  bulletPoint(
    "Chabad.org: Part of Chabad-Lubavitch's global infrastructure. One of the most-visited Jewish websites in the world. Enormous content team. Backed by the Chabad movement's fundraising network.",
    10
  );
  bulletPoint(
    "Al HaTorah: Family-founded project (Rabbi Hillel & Neima Novetsky). Supported by American Friends of Torah Leadership Institute (501(c)(3)). Small volunteer-driven team. Deep scholarly quality but limited engineering resources.",
    10
  );
  bulletPoint(
    "AllDaf: Backed by the Orthodox Union, one of the largest Orthodox Jewish organizations in the US. Launched January 2020 to coincide with the new Daf Yomi cycle. 26K+ downloads across 107 countries.",
    10
  );
  bulletPoint(
    "JewPT: Independent project by Jonathan Gugenheim. Launched late 2025. Early-stage with thousands of users. No known institutional funding.",
    10
  );

  // === PAGE 3: FEATURE MATRIX ===
  newPage();
  isNewPage = false;

  heading("Feature Comparison Matrix", 16);
  y += 4;

  bodyText(
    "Features weighted by importance to the target user (Jewish text learners seeking an interactive, guided study experience). Weight: 5 = critical differentiator, 1 = nice-to-have."
  );
  y += 5;

  const fHeaders = [
    "Feature (Weight)",
    "ChavrutAI",
    "Sefaria",
    "Chabad",
    "Al HaTorah",
    "AllDaf",
  ];
  const fWidths = [130, 82, 82, 82, 82, 82];
  const fRows = [
    ["Talmud Bilingual Reader (5)", "YES", "YES", "Partial", "No", "Partial"],
    ["AI Study Partner (5)", "YES", "No", "No", "No", "No"],
    ["Mishnah Reader (4)", "YES", "YES", "Partial", "Partial", "No"],
    ["Bible Reader (4)", "YES", "YES", "YES", "YES", "No"],
    ["Jastrow Dictionary (4)", "YES", "No", "No", "No", "No"],
    ["Term Highlighting (3)", "YES", "No", "No", "No", "No"],
    ["Reference Panel (3)", "YES", "Links", "No", "YES", "No"],
    ["Source Sheets (3)", "No", "YES", "No", "No", "No"],
    ["Mobile App (3)", "No", "YES", "YES", "Android", "YES"],
    ["Audio/Video Shiurim (2)", "No", "No", "YES", "No", "YES"],
    ["Open API (2)", "No", "YES", "No", "No", "No"],
    ["Community Features (2)", "No", "YES", "Ask Rabbi", "Collab", "No"],
    ["Offline Access (2)", "No", "YES", "YES", "No", "YES"],
    ["Daily Study Calendar (1)", "No", "YES", "YES", "No", "YES"],
    ["Multilingual UI (1)", "No", "No", "8 langs", "Heb/Eng", "No"],
  ];

  const x0 = MARGIN;
  let tableY = y;
  const cellH = 18;

  // Header
  doc.setFillColor(...COLORS.headerBg);
  doc.rect(x0, tableY, fWidths.reduce((a, b) => a + b, 0), cellH, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  let cx = x0;
  for (let i = 0; i < fHeaders.length; i++) {
    doc.text(fHeaders[i], cx + 3, tableY + 12);
    cx += fWidths[i];
  }
  tableY += cellH;

  // Rows
  doc.setFontSize(7.5);
  for (let r = 0; r < fRows.length; r++) {
    if (r % 2 === 1) {
      doc.setFillColor(...COLORS.rowAlt);
      doc.rect(
        x0,
        tableY,
        fWidths.reduce((a, b) => a + b, 0),
        cellH,
        "F"
      );
    }
    cx = x0;
    for (let c = 0; c < fRows[r].length; c++) {
      const val = fRows[r][c];
      if (c > 0) {
        if (val === "YES") {
          doc.setTextColor(...COLORS.green);
          doc.setFont("helvetica", "bold");
        } else if (val === "No") {
          doc.setTextColor(...COLORS.red);
          doc.setFont("helvetica", "normal");
        } else {
          doc.setTextColor(...COLORS.gray);
          doc.setFont("helvetica", "normal");
        }
      } else {
        doc.setTextColor(...COLORS.darkText);
        doc.setFont("helvetica", "normal");
      }
      doc.text(val, cx + 3, tableY + 12);
      cx += fWidths[c];
    }
    tableY += cellH;
  }

  y = tableY + 15;

  subheading("Key Takeaways");
  bulletPoint(
    'ChavrutAI wins on AI integration, Jastrow dictionary, and term highlighting — features no competitor offers. These are "Delighter" features in Kano terms.',
    10
  );
  bulletPoint(
    'Sefaria dominates on breadth: source sheets, open API, mobile, community, and offline access. These are increasingly "Basic" (expected) features.',
    10
  );
  bulletPoint(
    "The biggest gap for ChavrutAI is mobile: every major competitor has a mobile app. This is a high-weight missing feature.",
    10
  );

  // === PAGE 4: POSITIONING MAP ===
  newPage();
  isNewPage = false;

  heading("Strategic Positioning Map", 16);
  y += 4;

  bodyText(
    "Axes chosen based on buyer decision criteria: (1) Study Depth — how deeply the platform supports serious text study vs. casual browsing, and (2) AI/Technology Innovation — how much the platform leverages modern technology to enhance learning."
  );
  y += 10;

  // Draw 2x2 grid
  const gridX = MARGIN + 60;
  const gridY = y + 10;
  const gridW = 380;
  const gridH = 300;

  // Background
  doc.setFillColor(252, 250, 245);
  doc.rect(gridX, gridY, gridW, gridH, "F");

  // Grid lines
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.5);
  doc.line(gridX, gridY + gridH / 2, gridX + gridW, gridY + gridH / 2);
  doc.line(gridX + gridW / 2, gridY, gridX + gridW / 2, gridY + gridH);

  // Axes
  doc.setDrawColor(...COLORS.navy);
  doc.setLineWidth(1.5);
  doc.line(gridX, gridY + gridH, gridX, gridY);
  doc.line(gridX, gridY + gridH, gridX + gridW, gridY + gridH);

  // Arrow heads
  doc.setFillColor(...COLORS.navy);
  doc.triangle(gridX - 4, gridY + 5, gridX + 4, gridY + 5, gridX, gridY - 3, "F");
  doc.triangle(
    gridX + gridW - 5,
    gridY + gridH - 4,
    gridX + gridW - 5,
    gridY + gridH + 4,
    gridX + gridW + 3,
    gridY + gridH,
    "F"
  );

  // Axis labels
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  setColor(COLORS.navy);
  doc.text("AI / Technology Innovation →", gridX + gridW / 2 - 60, gridY + gridH + 25);

  const textWidth = doc.getTextWidth("← Study Depth →");

  doc.text("High", gridX - 8, gridY + 5, { align: "right" });
  doc.text("Low", gridX - 8, gridY + gridH, { align: "right" });
  doc.text("Low", gridX, gridY + gridH + 15);
  doc.text("High", gridX + gridW - 15, gridY + gridH + 15);

  // Rotated Y axis label
  doc.text("← Study Depth →", gridX - 35, gridY + gridH / 2, {
    angle: 90,
  });

  // Quadrant labels
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  setColor(COLORS.gray);
  doc.text("Deep Study +", gridX + 5, gridY + 15);
  doc.text("Traditional Tools", gridX + 5, gridY + 25);
  doc.text("Deep Study +", gridX + gridW / 2 + 10, gridY + 15);
  doc.text("Modern Tech", gridX + gridW / 2 + 10, gridY + 25);
  doc.text("Casual Learning +", gridX + 5, gridY + gridH / 2 + 15);
  doc.text("Traditional Tools", gridX + 5, gridY + gridH / 2 + 25);
  doc.text("Casual Learning +", gridX + gridW / 2 + 10, gridY + gridH / 2 + 15);
  doc.text("Modern Tech", gridX + gridW / 2 + 10, gridY + gridH / 2 + 25);

  // Plot competitors as circles with labels
  function plotPoint(name, xPct, yPct, color, radius) {
    const px = gridX + gridW * xPct;
    const py = gridY + gridH * (1 - yPct);
    doc.setFillColor(...color);
    doc.circle(px, py, radius || 8, "F");
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    setColor(COLORS.darkText);
    doc.text(name, px + 12, py + 3);
  }

  plotPoint("ChavrutAI", 0.72, 0.75, [180, 100, 30], 10);
  plotPoint("Sefaria", 0.45, 0.65, [60, 100, 160]);
  plotPoint("Al HaTorah", 0.2, 0.82, [100, 140, 80]);
  plotPoint("Chabad.org", 0.35, 0.35, [140, 60, 60]);
  plotPoint("AllDaf", 0.25, 0.45, [100, 80, 140]);
  plotPoint("JewPT", 0.8, 0.25, [160, 120, 60]);

  y = gridY + gridH + 40;

  subheading("Map Interpretation");
  bulletPoint(
    "ChavrutAI occupies the high-value quadrant: deep study + modern tech. No other established player is here. JewPT is nearby on the tech axis but lacks depth (no text reader).",
    10
  );
  bulletPoint(
    'Al HaTorah has the deepest study tools but minimal tech innovation. Sefaria is in the middle — broad but not "smart." Chabad.org and AllDaf are content-consumption platforms, not study tools.',
    10
  );
  bulletPoint(
    "The white space opportunity is clear: the intersection of serious text study and AI-powered learning tools. ChavrutAI should defend this position aggressively.",
    10
  );

  // === PAGE 5: WHITE SPACE & OPPORTUNITIES ===
  newPage();
  isNewPage = false;

  heading("White Space & Opportunities", 16);
  y += 4;

  subheading("Gaps No Competitor Serves Well");

  bulletPoint(
    "AI-GUIDED TALMUD STUDY: No platform deeply integrates AI into the text-reading flow. Sefaria experiments with AI but hasn't shipped a user-facing AI study partner. ChavrutAI's AI chavruta is first-to-market in this specific niche.",
    10
  );
  bulletPoint(
    'BEGINNER-FRIENDLY TALMUD ON-RAMP: Sefaria is powerful but intimidating. Chabad is accessible but not Talmud-focused. There is no "Duolingo for Talmud" — a guided, progressive learning path. ChavrutAI could build this.',
    10
  );
  bulletPoint(
    'INTEGRATED ARAMAIC DICTIONARY: ChavrutAI\'s Jastrow dictionary is unique — no other platform puts a Talmudic dictionary alongside the text reader. This could become a "must-have" feature for Talmud learners.',
    10
  );
  bulletPoint(
    "CROSS-TEXT TERM HIGHLIGHTING: ChavrutAI's gazetteer-based highlighting (concepts, names, places) across texts is not offered by any competitor. This could become a study methodology differentiator.",
    10
  );

  y += 5;
  subheading("Kano Analysis: Where the Bar Is Moving");

  bodyText("BASIC features (table stakes — must have to compete):");
  bulletPoint("Bilingual Hebrew/English text display", 20);
  bulletPoint("Bible and Talmud text availability", 20);
  bulletPoint("Mobile-responsive design (not yet an app, but must work on mobile)", 20);

  bodyText("PERFORMANCE features (more = better, linear satisfaction):");
  bulletPoint("Number of texts/tractates available", 20);
  bulletPoint("Commentary depth and variety", 20);
  bulletPoint("Search quality and speed", 20);

  bodyText("DELIGHTER features (unexpected, high satisfaction — today's differentiators):");
  bulletPoint("AI study partner (ChavrutAI's key differentiator)", 20);
  bulletPoint("Integrated Jastrow dictionary alongside text", 20);
  bulletPoint("Contextual term highlighting with gazetteer", 20);
  bulletPoint("Reference panel linking Bible citations from Talmud text", 20);

  bodyText(
    "Kano insight: Sefaria's Source Sheets were once a delighter — they're now expected (Basic). AI-powered study is currently a Delighter. Within 2-3 years, it will become a Performance feature. ChavrutAI has a window to establish leadership before competitors catch up."
  );

  // === PAGE 6: ACTION PLAN ===
  newPage();
  isNewPage = false;

  heading("Action Plan", 16);
  y += 4;

  subheading("Action 1: Build the AI Moat");
  bodyText(
    "ChavrutAI's AI chavruta is its strongest competitive advantage. Deepen it beyond a chatbot: make the AI aware of the specific daf the user is reading, surface relevant Rashi/Tosafot commentary in the AI's responses, and offer AI-generated summaries of complex sugyot. Sefaria has acknowledged AI experimentation but hasn't shipped user-facing AI study features yet (source: sefaria.org/about). The window is 12-18 months before Sefaria or a funded competitor enters this space seriously."
  );

  y += 5;
  subheading("Action 2: Close the Mobile Gap");
  bodyText(
    "Every major competitor has a mobile app — Sefaria (iOS + Android, offline), Chabad.org (daily study app), AllDaf (iOS + Android), even Al HaTorah (Android). ChavrutAI currently has no mobile app. 60%+ of Jewish text study happens on mobile (commute, synagogue, between tasks). A progressive web app (PWA) is the fastest path — it avoids App Store friction while providing an app-like experience. Prioritize the Talmud reader and AI chat for mobile."
  );

  y += 5;
  subheading("Action 3: Target the 'Overwhelmed Beginner' Segment");
  bodyText(
    'Sefaria\'s G2 and app store reviews repeatedly mention being "overwhelming" and "hard to navigate" for new users (source: Apple App Store, 4.6/5 avg with consistent UX complaints). Chabad.org\'s content is vast but denominationally filtered. Position ChavrutAI as the welcoming entry point: "Start studying Talmud today with an AI guide." Create a guided first-time experience that walks users through their first daf with AI explanations at each step.'
  );

  y += 10;
  subheading("Battlecard: Trap-Setting Questions for Positioning");
  bodyText("Use these in marketing copy, social media, or content to highlight competitor gaps:");
  y += 3;

  bulletPoint(
    '"Can your current text study tool explain what you\'re reading in plain English when you get stuck?" (Exposes: Sefaria has no AI, Chabad has no interactive Talmud)',
    10
  );
  bulletPoint(
    '"Does your Talmud app include a built-in Aramaic dictionary?" (Exposes: no competitor has integrated Jastrow)',
    10
  );
  bulletPoint(
    '"Can you highlight and explore key concepts, people, and places across the text you\'re reading?" (Exposes: no competitor has term highlighting/gazetteer)',
    10
  );
  bulletPoint(
    '"Does your study platform help you understand the sugya, or just show you the text?" (Exposes: all competitors are passive text display; ChavrutAI offers active AI-guided understanding)',
    10
  );

  // === PAGE 7: SOURCES ===
  newPage();
  isNewPage = false;

  heading("Sources", 16);
  y += 4;

  const sources = [
    ["1", "Sefaria Impact Report 2024", "https://www.sefaria.org/static/files/Sefaria_Impact_Report_2024.pdf"],
    ["2", "Sefaria About Page", "https://www.sefaria.org/about"],
    ["3", "Sefaria Developer Portal", "https://developers.sefaria.org"],
    ["4", "Sefaria Wikipedia Entry", "https://en.wikipedia.org/wiki/Sefaria"],
    ["5", "Sefaria iOS App Store Listing", "https://apps.apple.com/us/app/sefaria-jewish-texts-library/id1163273965"],
    ["6", "Projects Powered by Sefaria", "https://developers.sefaria.org/docs/powered-by-sefaria"],
    ["7", "AlHaTorah.org Main Site", "https://alhatorah.org"],
    ["8", "Jewish Action — Torah Access Reimagined: Al HaTorah.org", "https://jewishaction.com/books/reviews/torah-access-reimagined-al-hatorah-org/"],
    ["9", "Al HaTorah Google Play Listing", "https://play.google.com/store/apps/details?id=com.alhatorah.alhatorah"],
    ["10", "Chabad.org Torah Texts Portal", "https://www.chabad.org/torah-texts/"],
    ["11", "Chabad.org Classic Texts Library", "https://www.chabad.org/library/article_cdo/aid/109864/jewish/Classic-Texts.htm"],
    ["12", "Chabad.org Daily Torah Study App", "https://www.chabad.org/library/article_cdo/aid/2452166/jewish/Daily-Torah-Study-App.htm"],
    ["13", "AllDaf by Orthodox Union", "https://alldaf.org"],
    ["14", "AllDaf iOS App Store Listing", "https://apps.apple.com/us/app/all-daf/id1480151101"],
    ["15", "JewPT AI Chevruta", "https://jewpt.com"],
    ["16", "Sefaria Alternatives — AlternativeTo", "https://alternativeto.net/software/sefaria/"],
    ["17", "SimilarWeb — sefaria.org competitors", "https://www.similarweb.com/website/sefaria.org/competitors/"],
    ["18", "Bart Ehrman — Sefaria Review", "https://www.bartehrman.com/sefaria-review/"],
  ];

  doc.setFontSize(8.5);
  for (const [num, title, url] of sources) {
    checkSpace(30);
    isNewPage = false;
    doc.setFont("helvetica", "bold");
    setColor(COLORS.darkText);
    doc.text(`[${num}]`, MARGIN, y);
    doc.setFont("helvetica", "normal");
    doc.text(title, MARGIN + 20, y);
    y += 12;
    setColor(COLORS.gray);
    doc.setFontSize(7.5);
    const urlLines = doc.splitTextToSize(url, CONTENT_W - 20);
    doc.text(urlLines[0], MARGIN + 20, y);
    y += 14;
    doc.setFontSize(8.5);
  }

  // Verify no blank pages
  const totalPages = doc.internal.getNumberOfPages();
  console.log(`Generated PDF with ${totalPages} pages`);

  const output = doc.output("arraybuffer");
  fs.writeFileSync("competitive-analysis.pdf", Buffer.from(output));
  console.log("PDF saved to competitive-analysis.pdf");
}

generatePDF();
