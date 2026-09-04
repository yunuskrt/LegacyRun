import { describe, expect, it } from "vitest";
import { SEED_LENGTH, drawIndex, mintSeed, seededRng } from "@/lib/rng";

describe("seededRng", () => {
  it("reproduces the same stream for the same seed", () => {
    const a = seededRng("k3f9qv1p");
    const b = seededRng("k3f9qv1p");

    const first = Array.from({ length: 20 }, () => a());
    const second = Array.from({ length: 20 }, () => b());

    expect(first).toEqual(second);
  });

  it("produces a different stream for a different seed", () => {
    const a = Array.from({ length: 20 }, seededRng("aaaaaaaa"));
    const b = Array.from({ length: 20 }, seededRng("aaaaaaab"));

    expect(a).not.toEqual(b);
  });

  it("stays inside [0, 1)", () => {
    const rng = seededRng("bounds");

    for (let index = 0; index < 500; index += 1) {
      const value = rng();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});

describe("drawIndex", () => {
  it("wraps an rng that returns exactly 1", () => {
    expect(drawIndex(5, () => 1)).toBe(0);
    expect(drawIndex(1292, () => 1)).toBe(0);
  });

  it("addresses the whole range", () => {
    expect(drawIndex(4, () => 0)).toBe(0);
    expect(drawIndex(4, () => 0.999)).toBe(3);
  });

  it("returns the first row when the draw lands at zero", () => {
    expect(drawIndex(1292, () => 0)).toBe(0);
  });

  it("returns the last row when the draw lands just short of one", () => {
    expect(drawIndex(1292, () => 0.9999999)).toBe(1291);
  });

  it("stays inside the range across the whole unit interval", () => {
    for (let step = 0; step <= 1000; step += 1) {
      const index = drawIndex(7, () => step / 1000);

      expect(index).toBeGreaterThanOrEqual(0);
      expect(index).toBeLessThan(7);
    }
  });

  // `% 0` is NaN, so an unguarded empty pool indexes `undefined` instead of failing.
  it("returns zero for an empty pool", () => {
    expect(drawIndex(0, () => 0.5)).toBe(0);
  });
});

describe("mintSeed", () => {
  it("mints a lowercase alphanumeric seed the query schema accepts", () => {
    const seed = mintSeed(seededRng("mint"));

    expect(seed).toHaveLength(SEED_LENGTH);
    expect(seed).toMatch(/^[a-z0-9]{8}$/);
  });
});
