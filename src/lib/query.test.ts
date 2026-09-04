import { describe, expect, it } from "vitest";
import { splitIds } from "@/lib/query";

describe("splitIds", () => {
  it("splits a comma-separated list", () => {
    expect(splitIds("CHI-1996,LAL-2020")).toEqual(["CHI-1996", "LAL-2020"]);
  });

  it("trims each entry", () => {
    expect(splitIds(" CHI-1996 , LAL-2020 ")).toEqual(["CHI-1996", "LAL-2020"]);
  });

  // An empty parameter means "no ids", never one blank id the schemas would reject.
  it("drops empty entries rather than emitting blanks", () => {
    expect(splitIds("")).toEqual([]);
    expect(splitIds(",")).toEqual([]);
    expect(splitIds("CHI-1996,,LAL-2020,")).toEqual(["CHI-1996", "LAL-2020"]);
  });

  it("keeps duplicates for the caller to reject", () => {
    expect(splitIds("CHI-1996,CHI-1996")).toEqual(["CHI-1996", "CHI-1996"]);
  });

  it("keeps the order it was given", () => {
    expect(splitIds("c,a,b")).toEqual(["c", "a", "b"]);
  });
});
