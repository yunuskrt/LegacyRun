import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  BREATHE,
  DENY_SHAKE,
  DURATION,
  EASE,
  FADE_RISE,
  entranceFrom,
  MAX_STAGGER_DELAY,
  SECTION_STEP,
  STAGE_STEP,
  STAGGER_STEP,
  sectionDelay,
  sequenceDelay,
  sequencedTransition,
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

// A zero-duration entrance still paints its initial frame — measured, not
// assumed. Reduced motion therefore means no declared entrance at all.
describe("entranceFrom", () => {
  it("declares the entrance only when the element is actually entering", () => {
    expect(entranceFrom(true, false, FADE_RISE.initial)).toBe(
      FADE_RISE.initial
    );
    expect(entranceFrom(false, false, FADE_RISE.initial)).toBe(false);
  });

  it("declares nothing under reduced motion, entering or not", () => {
    expect(entranceFrom(true, true, FADE_RISE.initial)).toBe(false);
    expect(entranceFrom(false, true, FADE_RISE.initial)).toBe(false);
  });

  // `false` is motion's own "start where you are", so the two non-entering
  // cases are indistinguishable to the element — which is the point.
  it("returns motion's start-where-you-are rather than an empty target", () => {
    expect(entranceFrom(false, false, { opacity: 0 })).not.toEqual({});
    expect(entranceFrom(false, false, { opacity: 0 })).toBe(false);
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

describe("sectionDelay", () => {
  it("puts the first section at zero", () => {
    expect(sectionDelay(0)).toBe(0);
    expect(sectionDelay(-1)).toBe(0);
  });

  // The whole point of a constant beat: the delay of a section must not depend
  // on how much the section before it contained. An implementation that summed
  // the previous block's length would read identically at three sections of
  // equal size and blow out the moment one of them grew.
  it("does not depend on how many items the previous section held", () => {
    const shortRun = sectionDelay(2);
    const longRun = sectionDelay(2);

    expect(shortRun).toBe(longRun);
    expect(sectionDelay(2)).toBe(2 * SECTION_STEP);
    expect(sectionDelay(2) - sectionDelay(1)).toBeCloseTo(
      sectionDelay(1) - sectionDelay(0)
    );
  });

  it("spaces every section by exactly one beat", () => {
    for (let section = 1; section < 6; section += 1) {
      expect(sectionDelay(section) - sectionDelay(section - 1)).toBeCloseTo(
        SECTION_STEP
      );
    }
  });

  it("collapses to zero under reduced motion", () => {
    expect(sectionDelay(2, { reduced: true })).toBe(0);
    expect(sectionDelay(5, { reduced: true })).toBe(0);
  });

  // Two scales, not one: a section beat has to outlast a list step or the
  // blocks read as a single long list, and stay inside a transition or the
  // screen pauses between them. Spelled out rather than compared to
  // SECTION_STEP, which would assert the constant back to itself.
  it("beats slower than a list steps and faster than a transition runs", () => {
    const beat = sectionDelay(1);

    expect(beat).toBeGreaterThan(STAGGER_STEP);
    expect(beat).toBeGreaterThan(STAGE_STEP);
    expect(beat).toBeLessThanOrEqual(DURATION.base);
    expect(beat).toBeCloseTo(0.18);
  });
});

describe("sequenceDelay", () => {
  it("adds the section beat to the position within the section", () => {
    expect(sequenceDelay(2, 3)).toBeCloseTo(
      2 * SECTION_STEP + 3 * STAGGER_STEP
    );
  });

  it("degenerates to a plain stagger in the first section", () => {
    expect(sequenceDelay(0, 4)).toBe(staggerDelay(4));
  });

  it("degenerates to a plain section beat for the first element", () => {
    expect(sequenceDelay(2, 0)).toBe(sectionDelay(2));
  });

  // Both halves have to honour it — a mutant that drops `reduced` from only the
  // section half still passes every stagger test in this file.
  it("collapses to zero under reduced motion, both halves", () => {
    expect(sequenceDelay(2, 4, { reduced: true })).toBe(0);
  });

  it("keeps the within-section cap while sections keep accumulating", () => {
    expect(sequenceDelay(1, 40)).toBeCloseTo(SECTION_STEP + MAX_STAGGER_DELAY);
  });
});

// The staged result screen is the only place three sections run at once, and
// the budget is the thing a future constant change would silently blow.
describe("the staged screen budget", () => {
  const settle = (section: number, index: number, step?: number) =>
    sequenceDelay(section, index, step ? { step } : {}) + DURATION.base;

  it("stages a five-element header inside the stagger cap", () => {
    expect(staggerDelay(4, { step: STAGE_STEP })).toBeLessThanOrEqual(
      MAX_STAGGER_DELAY
    );
    expect(staggerDelay(4, { step: STAGE_STEP })).toBeCloseTo(0.24);
  });

  // Header (5 staged) → the five (5 cards) → path (4 rows) + recap, three
  // sections one beat apart. Measured in the browser at ~750ms end to end.
  it("finishes the whole three-section entrance under a second", () => {
    const last = Math.max(settle(0, 4, STAGE_STEP), settle(1, 4), settle(2, 3));

    expect(last).toBeCloseTo(0.69);
    expect(last).toBeLessThan(1);
  });

  it("is instant end to end under reduced motion", () => {
    const kinds = [
      sequencedTransition("base", 0, 4, { step: STAGE_STEP, reduced: true }),
      sequencedTransition("base", 1, 4, { reduced: true }),
      sequencedTransition("spring", 2, 3, { reduced: true }),
    ];

    kinds.forEach((transition) =>
      expect(transition).toEqual({ duration: 0, delay: 0 })
    );
  });
});

describe("sequencedTransition", () => {
  it("merges the sequence delay onto a timed transition", () => {
    expect(sequencedTransition("base", 1, 2)).toEqual({
      duration: DURATION.base,
      ease: EASE.enter,
      delay: SECTION_STEP + 2 * STAGGER_STEP,
    });
  });

  // The glyph is the only spring on the screen and it sits at index 0, so this
  // combination never runs with a real delay in the app.
  it("merges the delay onto the spring, which carries no duration", () => {
    expect(sequencedTransition("spring", 1, 0)).toEqual({
      type: "spring",
      stiffness: 340,
      damping: 26,
      delay: SECTION_STEP,
    });
  });

  it("agrees with sequenceDelay for every section and index", () => {
    for (let section = 0; section < 4; section += 1) {
      for (let index = 0; index < 6; index += 1) {
        const transition = sequencedTransition("base", section, index) as {
          delay: number;
        };

        expect(transition.delay).toBe(sequenceDelay(section, index));
      }
    }
  });
});

describe("BREATHE — the one sanctioned loop", () => {
  it("returns to where it started, so a repeat does not jump", () => {
    expect(BREATHE.opacity[0]).toBe(BREATHE.opacity.at(-1));
  });

  it("stays a dimming, never a fade to nothing or a flash", () => {
    expect(Math.min(...BREATHE.opacity)).toBeGreaterThanOrEqual(0.7);
    expect(Math.max(...BREATHE.opacity)).toBe(1);
  });

  // Slow enough to read as breathing rather than blinking, which is what
  // makes one looping animation tolerable on the page at all.
  it("runs an order of magnitude slower than any transition", () => {
    expect(BREATHE.duration).toBeGreaterThanOrEqual(2.5);
    expect(BREATHE.duration).toBeLessThanOrEqual(3);
    expect(BREATHE.duration).toBeGreaterThan(DURATION.slow * 5);
  });
});

describe("DENY_SHAKE", () => {
  // A keyframe run that does not end where it began leaves the slot
  // permanently offset — silent, and only visible by measuring.
  it("starts and ends at rest", () => {
    expect(DENY_SHAKE.x[0]).toBe("0%");
    expect(DENY_SHAKE.x.at(-1)).toBe("0%");
  });

  it("shakes two full cycles", () => {
    const offsets = DENY_SHAKE.x
      .slice(1, -1)
      .map((value) => Number.parseFloat(value));

    expect(offsets).toHaveLength(4);
    offsets.forEach((offset, index) => {
      expect(Math.sign(offset)).toBe(index % 2 === 0 ? -1 : 1);
    });
  });

  it("is symmetric and stays under the house amplitude", () => {
    const magnitudes = DENY_SHAKE.x.map((value) =>
      Math.abs(Number.parseFloat(value))
    );

    expect(new Set(magnitudes.filter(Boolean)).size).toBe(1);
    expect(Math.max(...magnitudes)).toBeLessThanOrEqual(4);
  });

  // Percentages of the shaken element, so the court's container-relative
  // sizing carries it down to 390 instead of drifting.
  it("is expressed in percentages, never pixels", () => {
    DENY_SHAKE.x.forEach((value) => expect(value).toMatch(/%$/));
  });

  it("is a single beat, well inside the slowest transition", () => {
    expect(DENY_SHAKE.duration).toBeLessThanOrEqual(DURATION.slow);
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
