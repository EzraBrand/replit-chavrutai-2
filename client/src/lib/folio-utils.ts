/**
 * Folio utility functions for Talmud navigation
 */

export interface FolioButton {
  folio: number;
  side: "a" | "b";
  label: string;
}

/**
 * Generates an array of folio buttons for a given chapter range
 * @param startFolio - Starting folio number
 * @param startSide - Starting side ("a" or "b")
 * @param endFolio - Ending folio number
 * @param endSide - Ending side ("a" or "b")
 * @returns Array of folio button objects
 */
export function generateFolioButtons(
  startFolio: number,
  startSide: "a" | "b",
  endFolio: number,
  endSide: "a" | "b"
): FolioButton[] {
  const folios: FolioButton[] = [];

  for (let folio = startFolio; folio <= endFolio; folio++) {
    if (folio === startFolio && folio === endFolio) {
      // Same folio range
      if (startSide === "a") {
        folios.push({ folio, side: "a", label: `${folio}a` });
        if (endSide === "b") {
          folios.push({ folio, side: "b", label: `${folio}b` });
        }
      } else {
        folios.push({ folio, side: "b", label: `${folio}b` });
      }
    } else if (folio === startFolio) {
      // First folio
      if (startSide === "a") {
        folios.push({ folio, side: "a", label: `${folio}a` });
        folios.push({ folio, side: "b", label: `${folio}b` });
      } else {
        folios.push({ folio, side: "b", label: `${folio}b` });
      }
    } else if (folio === endFolio) {
      // Last folio
      folios.push({ folio, side: "a", label: `${folio}a` });
      if (endSide === "b") {
        folios.push({ folio, side: "b", label: `${folio}b` });
      }
    } else {
      // Middle folios
      folios.push({ folio, side: "a", label: `${folio}a` });
      folios.push({ folio, side: "b", label: `${folio}b` });
    }
  }

  return folios;
}

/**
 * Formats a folio reference for display
 * @param folio - Folio number
 * @param side - Side ("a" or "b")
 * @returns Formatted folio string (e.g., "2a", "15b")
 */
export function formatFolioReference(folio: number, side: "a" | "b"): string {
  return `${folio}${side}`;
}

/**
 * Parses a folio reference string
 * @param folioRef - Folio reference string (e.g., "2a", "15b")
 * @returns Object with folio number and side, or null if invalid
 */
export function parseFolioReference(folioRef: string): { folio: number; side: "a" | "b" } | null {
  const match = folioRef.match(/^(\d+)([ab])$/);
  if (!match) return null;
  
  return {
    folio: parseInt(match[1], 10),
    side: match[2] as "a" | "b"
  };
}