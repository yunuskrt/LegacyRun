import type { Transition } from "motion/react";

// The single motion vocabulary for the whole app. Motion values are JavaScript,
// so they cannot be Tailwind `@theme` tokens — the CSS half of these values
// lives in `src/app/globals.css` as `--duration-*` / `--ease-*` and must be
// kept numerically identical.

export const DURATION = {
  instant: 0.12,
  quick: 0.18,
  base: 0.24,
  slow: 0.4,
} as const;

// motion's built-in "easeOut" and "easeIn", written out so the CSS side can
// mirror them as cubic-bezier().
type Bezier = [number, number, number, number];

export const EASE: Record<"enter" | "exit", Bezier> = {
  enter: [0, 0, 0.58, 1],
  exit: [0.42, 0, 1, 1],
};

export const SPRING = {
  type: "spring",
  stiffness: 340,
  damping: 26,
} as const satisfies Transition;

export const FADE_RISE = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
} as const;

export const STAGGER_STEP = 0.03;

// No stagger sequence may run longer than this end to end, however long the
// list is. Real rosters run past 20 players; uncapped, revealing one took most
// of a second.
export const MAX_STAGGER_DELAY = 0.3;

export type TransitionKind = "quick" | "base" | "slow" | "exit" | "spring";

const TRANSITIONS: Record<TransitionKind, Transition> = {
  quick: { duration: DURATION.quick, ease: EASE.enter },
  base: { duration: DURATION.base, ease: EASE.enter },
  slow: { duration: DURATION.slow, ease: EASE.enter },
  exit: { duration: DURATION.quick, ease: EASE.exit },
  spring: SPRING,
};

const INSTANT: Transition = { duration: 0 };

export const transitionFor = (
  kind: TransitionKind,
  reduced = false
): Transition => (reduced ? INSTANT : TRANSITIONS[kind]);

type StaggerOptions = {
  step?: number;
  reduced?: boolean;
};

export const staggerDelay = (
  index: number,
  { step = STAGGER_STEP, reduced = false }: StaggerOptions = {}
): number => {
  if (reduced || index <= 0) return 0;

  return Math.min(index * step, MAX_STAGGER_DELAY);
};

// The delay is merged last so it still wins if a kind ever carries one of its
// own. No kind does today, which is why the order is a convention rather than a
// rule a test can catch.
export const staggeredTransition = (
  kind: TransitionKind,
  index: number,
  options: StaggerOptions = {}
): Transition => ({
  ...transitionFor(kind, options.reduced ?? false),
  delay: staggerDelay(index, options),
});
