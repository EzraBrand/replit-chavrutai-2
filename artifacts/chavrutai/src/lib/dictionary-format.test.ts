import { describe, expect, it } from "vitest";
import bdbData from "@/shared/data/lexicon-mappings/bdb.json";
import { expandAbbreviations } from "@/lib/dictionary-format";

const mappings = bdbData.mappings;

describe("BDB abbreviation expansion", () => {
  it.each([
    ["geneal.", "genealogical"],
    ["post-ex.", "post-exilic"],
    ["Apr.", "April"],
    ["NNW.", "north-northwest"],
    ["redupl.", "reduplication"],
    ["explan.", "explanation"],
    ["unintelling.", "unintelligible"],
    ["ch.", "chapter"],
    ["metath.", "metathesis"],
    ["collat.", "collateral"],
    ["d. f.", "dagesh forte"],
    ["interr.", "interrogative"],
    ["eschatol.", "eschatological"],
    ["Periphr.", "Periphrasis"],
    ["Odyss.", "Odyssey"],
    ["Il.", "Iliad"],
  ])("expands %s to %s", (abbreviation, expansion) => {
    expect(expandAbbreviations(abbreviation, mappings)).toContain(
      `>${expansion}</span>`,
    );
  });

  it.each([
    ["ii", "2"],
    ["iii", "3"],
    ["iv", "4"],
    ["v", "5"],
    ["vi", "6"],
    ["vii", "7"],
    ["viii", "8"],
    ["ix", "9"],
    ["x", "10"],
    ["xi", "11"],
    ["xii", "12"],
    ["xiii", "13"],
    ["xiv", "14"],
    ["xv", "15"],
    ["xvi", "16"],
    ["xvii", "17"],
    ["xviii", "18"],
    ["xix", "19"],
    ["xx", "20"],
  ])("expands Roman numeral %s to %s", (numeral, number) => {
    expect(expandAbbreviations(numeral, mappings)).toContain(`>${number}</span>`);
  });

  it("does not expand Roman-numeral keys inside ordinary words", () => {
    expect(
      expandAbbreviations("civil vivid mix textile", mappings),
    ).toBe("civil vivid mix textile");
  });
});