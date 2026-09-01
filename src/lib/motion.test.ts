import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  DURATION,
  EASE,
  MAX_STAGGER_DELAY,
  STAGGER_STEP,
  staggerDelay,
  staggeredTransition,
  transitionFor,
} from "@/lib/motion";
import type { TransitionKind } from "@/lib/motion";

const KINDS: TransitionKind[] = ["quick", "base", "slow", "exit", "spring"];

describe("staggerDelay", () => {
  it("starts at zero", () => {
    expect(staggerDelay(0)).toBe(0);
  });

  it("increases monotonically before the cap", () => {
    const delays = [0, 1, 2, 3, 4].map((index) => staggerDelay(index));

    delays.forEach((delay, index) => {
      if (index > 0) expect(delay).toBeGreaterThan(delays[index - 1]);
    });
  });

  it("finishes a five-item list inside the cap", () => {
    expect(staggerDelay(4)).toBeLessThanOrEqual(0.3);
  });

  it("caps a twenty-three-item list at 0.3 seconds", () => {
    expect(staggerDelay(22)).toBe(0.3);
    expect(staggerDelay(22, { step: 0.06 })).toBe(0.3);
  });

  it("never exceeds the cap at any index or step", () => {
    for (let index = 0; index < 60; index += 1) {
      expect(staggerDelay(index)).toBeLessThanOrEqual(MAX_STAGGER_DELAY);
      expect(staggerDelay(index, { step: 0.2 })).toBeLessThanOrEqual(
        MAX_STAGGER_DELAY
      );
    }
  });

  it("honours a custom step below the cap", () => {
    expect(staggerDelay(2, { step: 0.06 })).toBeCloseTo(0.12);
    expect(staggerDelay(3)).toBeCloseTo(3 * STAGGER_STEP);
  });

  it("collapses to zero under reduced motion", () => {
    expect(staggerDelay(4, { reduced: true })).toBe(0);
    expect(staggerDelay(22, { reduced: true })).toBe(0);
  });

  it("treats a negative index as zero", () => {
    expect(staggerDelay(-1)).toBe(0);
  });
});

describe("transitionFor", () => {
  it("returns a zero-duration transition for every kind under reduced motion", () => {
    KINDS.forEach((kind) => {
      expect(transitionFor(kind, true)).toEqual({ duration: 0 });
    });
  });

  it("carries a real duration for every timed kind when motion is allowed", () => {
    KINDS.filter((kind) => kind !== "spring").forEach((kind) => {
      const transition = transitionFor(kind) as { duration: number };

      expect(transition.duration).toBeGreaterThan(0);
      expect(transition.duration).toBeLessThanOrEqual(0.4);
    });
  });

  it("keeps the sanctioned spring from overshooting", () => {
    expect(transitionFor("spring")).toEqual({
      type: "spring",
      stiffness: 340,
      damping: 26,
    });
  });

  it("defaults to full motion when reduced is not given", () => {
    expect(transitionFor("base")).not.toEqual({ duration: 0 });
  });
});

describe("staggeredTransition", () => {
  it("keeps the delay when merged onto a timed transition", () => {
    expect(staggeredTransition("base", 3)).toEqual({
      duration: DURATION.base,
      ease: EASE.enter,
      delay: 3 * STAGGER_STEP,
    });
  });

  it("keeps the delay when merged onto the spring, which carries no duration", () => {
    expect(staggeredTransition("spring", 2, { step: 0.06 })).toEqual({
      type: "spring",
      stiffness: 340,
      damping: 26,
      delay: 0.12,
    });
  });

  it("caps the merged delay like staggerDelay does", () => {
    const transition = staggeredTransition("base", 22) as { delay: number };

    expect(transition.delay).toBe(0.3);
  });

  it("is fully instant under reduced motion, delay included", () => {
    expect(staggeredTransition("spring", 22, { reduced: true })).toEqual({
      duration: 0,
      delay: 0,
    });
  });
});

// The CSS half of the vocabulary cannot import the TS half, so nothing but this
// stops the two from drifting apart.
describe("globals.css mirrors the motion module", () => {
  const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");

  const valueOf = (token: string) => {
    const match = css.match(new RegExp(`--${token}:\\s*([^;]+);`));

    return match ? match[1].trim() : null;
  };

  it("declares every duration token with the same value in milliseconds", () => {
    Object.entries(DURATION).forEach(([name, seconds]) => {
      expect(valueOf(`duration-${name}`)).toBe(
        `${Math.round(seconds * 1000)}ms`
      );
    });
  });

  it("declares both easing curves as the same cubic-bezier", () => {
    Object.entries(EASE).forEach(([name, bezier]) => {
      expect(valueOf(`ease-${name}`)).toBe(
        `cubic-bezier(${bezier.join(", ")})`
      );
    });
  });

  it("neutralizes CSS animation for everything motion cannot reach", () => {
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).toMatch(/animation-duration:\s*1ms\s*!important/);
    expect(css).toMatch(/transition-duration:\s*1ms\s*!important/);
  });
});
