import type { Transition } from "motion/react";

// The app's motion vocabulary; globals.css mirrors it as `--duration-*` / `--ease-*`.

export const DURATION = {
  instant: 0.12,
  quick: 0.18,
  base: 0.24,
  slow: 0.4,
} as const;

// motion's "easeOut"/"easeIn", written out so CSS can mirror them as cubic-bezier().
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

// Small enough that the scale reads as arrival rather than a pop.
export const DOT_ENTRANCE = { opacity: 0, scale: 0.6 } as const;

export const STAGGER_STEP = 0.03;

// The whole sequence's ceiling, however long the list — a 20-man roster uncapped drags.
export const MAX_STAGGER_DELAY = 0.3;

// A header is a few elements, not a list — STAGGER_STEP's list rhythm vanishes there.
export const STAGE_STEP = 0.06;

// A constant beat, never the previous block's length — else sections compound.
export const SECTION_STEP = DURATION.quick;

// The app's one permitted loop; easeInOut because a one-way curve reads wrong looping.
export const BREATHE: { opacity: number[]; duration: number; ease: Bezier } = {
  opacity: [0.7, 1, 0.7],
  duration: 2.8,
  ease: [0.42, 0, 0.58, 1],
};

// Percentages, not px, so the shake scales with the court instead of drifting at 390.
export const DENY_SHAKE: { x: string[]; duration: number } = {
  x: ["0%", "-2.5%", "2.5%", "-2.5%", "2.5%", "0%"],
  duration: 0.2,
};

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

// A zero-duration entrance still paints its initial frame, so declare none at all.
export const entranceFrom = <T>(
  active: boolean,
  reduced: boolean,
  from: T
): T | false => (active && !reduced ? from : false);

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

// Delay merged last so it wins if a kind ever carries one; none does today.
export const staggeredTransition = (
  kind: TransitionKind,
  index: number,
  options: StaggerOptions = {}
): Transition => ({
  ...transitionFor(kind, options.reduced ?? false),
  delay: staggerDelay(index, options),
});

export const sectionDelay = (
  section: number,
  { reduced = false }: StaggerOptions = {}
): number => (reduced || section <= 0 ? 0 : section * SECTION_STEP);

export const sequenceDelay = (
  section: number,
  index: number,
  options: StaggerOptions = {}
): number => sectionDelay(section, options) + staggerDelay(index, options);

export const sequencedTransition = (
  kind: TransitionKind,
  section: number,
  index: number,
  options: StaggerOptions = {}
): Transition => ({
  ...transitionFor(kind, options.reduced ?? false),
  delay: sequenceDelay(section, index, options),
});
