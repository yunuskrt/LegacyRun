"use client";

import React from "react";
import { motion, useReducedMotion } from "motion/react";
import HeroCourt from "@/components/landing/HeroCourt";
import StartGameButton from "@/components/landing/StartGameButton";
import { Button } from "@/components/ui/button";
import { FIRST_SEASON, LAST_SEASON } from "@/lib/landing";
import { FADE_RISE, sequencedTransition } from "@/lib/motion";

type Props = {};

// The hero is above the fold, so it plays on mount — whileInView would fire instantly anyway.
const HeroSection = ({}: Props) => {
  const reduced = useReducedMotion() ?? false;

  const step = (section: number) => ({
    "data-motion-reveal": true,
    initial: FADE_RISE.initial,
    animate: FADE_RISE.animate,
    transition: sequencedTransition("slow", section, 0, { reduced }),
  });

  return (
    <section
      aria-labelledby="hero-title"
      className="bg-room px-6 pt-16 pb-20 sm:pt-24 sm:pb-28"
    >
      <div className="mx-auto grid w-full max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
          <motion.p
            {...step(0)}
            className="text-muted-foreground text-xs font-semibold tracking-[0.22em] uppercase"
          >
            {FIRST_SEASON} — {LAST_SEASON} · Real NBA History
          </motion.p>

          <motion.h1
            {...step(1)}
            id="hero-title"
            className="mt-5 text-[clamp(2.25rem,4.4vw,3.25rem)] leading-[1.05] font-bold tracking-tight"
          >
            Draft Legends.
            <br />
            Build Your Legacy.
          </motion.h1>

          <motion.p
            {...step(2)}
            className="text-muted-foreground mt-5 max-w-md text-base leading-relaxed text-pretty sm:text-lg"
          >
            Pick five players from any team-season in NBA history, then take
            them through a real playoff bracket.
          </motion.p>

          <motion.div {...step(3)} className="mt-9 flex flex-wrap gap-3">
            <StartGameButton />
            <Button
              asChild
              variant="ghost"
              className="border-border/70 h-12 border px-6 text-sm font-semibold tracking-[0.14em] uppercase"
            >
              <a href="#draft">How it works</a>
            </Button>
          </motion.div>
        </div>

        <HeroCourt section={4} />
      </div>
    </section>
  );
};

export default HeroSection;
