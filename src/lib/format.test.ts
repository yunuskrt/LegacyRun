import { describe, expect, it } from "vitest";
import { teamInitials } from "@/lib/format";

describe("teamInitials", () => {
  it("takes the last two words, not the first two", () => {
    expect(teamInitials("Los Angeles Lakers")).toBe("AL");
    expect(teamInitials("Portland Trail Blazers")).toBe("TB");
  });

  it("initials a two-word name in full", () => {
    expect(teamInitials("Chicago Bulls")).toBe("CB");
  });

  it("returns a single letter for a one-word name", () => {
    expect(teamInitials("Heat")).toBe("H");
  });

  it("ignores repeated and surrounding whitespace", () => {
    expect(teamInitials("  Boston   Celtics  ")).toBe("BC");
  });

  it("uppercases a lowercase name", () => {
    expect(teamInitials("chicago bulls")).toBe("CB");
  });

  it("keeps a leading digit as-is", () => {
    expect(teamInitials("Philadelphia 76ers")).toBe("P7");
  });

  it("is empty for an empty name rather than throwing", () => {
    expect(teamInitials("")).toBe("");
    expect(teamInitials("   ")).toBe("");
  });
});
