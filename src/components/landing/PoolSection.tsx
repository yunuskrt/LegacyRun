"use client";

import React from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import LandingSection from "@/components/landing/LandingSection";
import TweenNumber from "@/components/tournament/TweenNumber";
import { LANDING_STATS } from "@/lib/landing";
import { FADE_RISE, staggeredTransition } from "@/lib/motion";

type Props = {};

const withSeparators = (value: number) => value.toLocaleString("en-US");

const subscribeToNothing = () => () => {};

const PoolSection = ({}: Props) => {
  const reduced = useReducedMotion() ?? false;
  const tiles = React.useRef<HTMLDivElement>(null);
  // The count starts with the tiles, not on mount — the section sits below the fold.
  const isCounting = useInView(tiles, { once: true, amount: 0.4 });
  // Reduced motion is unknowable on the server, so the server and the hydrating client
  // must agree on the final number; the tween only takes over afterwards.
  const isHydrated = React.useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false
  );

  return (
    <LandingSection
      id="pool"
      eyebrow="The pool"
      title="Every team. Every season. Real players."
    >
      <div
        ref={tiles}
        className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5"
      >
        {LANDING_STATS.map((stat, index) => (
          <motion.div
            key={stat.label}
            className="border-border/60 bg-card/50 flex flex-col items-center justify-center rounded-xl border px-3 py-6 text-center last:col-span-2 lg:last:col-span-1"
            data-motion-reveal
            initial={FADE_RISE.initial}
            whileInView={FADE_RISE.animate}
            viewport={{ once: true, amount: 0.4 }}
            transition={staggeredTransition("slow", index, {
              step: 0.06,
              reduced,
            })}
          >
            <span className="text-primary text-2xl font-bold tracking-tight tabular-nums sm:text-3xl">
              {/* TweenNumber only moves when its value changes, so it mounts at 0 —
                  and mounts straight at the target if the tiles are already in view. */}
              {reduced || !isHydrated ? (
                withSeparators(stat.value)
              ) : (
                <TweenNumber
                  value={isCounting ? stat.value : 0}
                  format={withSeparators}
                />
              )}
            </span>
            <span className="text-muted-foreground mt-2 text-[0.6875rem] leading-tight font-semibold tracking-[0.14em] uppercase">
              {stat.label}
            </span>
          </motion.div>
        ))}
      </div>

      <p className="text-muted-foreground mt-8 text-sm leading-relaxed">
        Every rating is derived from real box-score and advanced stats — never
        hand-set.
      </p>
    </LandingSection>
  );
};

export default PoolSection;
