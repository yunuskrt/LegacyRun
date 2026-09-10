"use client";

import React from "react";
import { motion, useReducedMotion } from "motion/react";
import StartGameButton from "@/components/landing/StartGameButton";
import { FADE_RISE, transitionFor } from "@/lib/motion";

type Props = {};

const ClosingSection = ({}: Props) => {
  const reduced = useReducedMotion() ?? false;

  return (
    <motion.section
      aria-labelledby="closing-title"
      className="border-border/50 border-t px-6 py-20 text-center sm:py-24"
      data-motion-reveal
      initial={FADE_RISE.initial}
      whileInView={FADE_RISE.animate}
      viewport={{ once: true, amount: 0.3 }}
      transition={transitionFor("slow", reduced)}
    >
      <div className="mx-auto w-full max-w-2xl">
        <h2
          id="closing-title"
          className="text-2xl font-bold tracking-tight text-balance sm:text-3xl"
        >
          Draft Legends. Build Your Legacy.
        </h2>
        <p className="text-muted-foreground mt-3 text-sm sm:text-base">
          No sign-up. No account. Pick five and go.
        </p>

        <div className="mt-8 flex justify-center">
          <StartGameButton />
        </div>

        <p className="text-muted-foreground/70 mt-16 text-xs leading-relaxed text-balance">
          Data derived from publicly available historical NBA statistics.
          LegacyRun is an unofficial fan project and is not affiliated with the
          NBA.
        </p>
      </div>
    </motion.section>
  );
};

export default ClosingSection;
