"use client";

import React from "react";
import { motion, useReducedMotion } from "motion/react";
import { DOT_ENTRANCE, entranceFrom, staggeredTransition } from "@/lib/motion";
import { BAND_DOTS } from "@/lib/tournament-view";
import type { DifficultyBand } from "@/lib/tournament-view";

type Props = {
  band: DifficultyBand;
  dimmed?: boolean;
};

// Low enough that ten meters filling at once don't read as a cascade.
const DOT_STEP = 0.04;

const DifficultyMeter = ({ band, dimmed = false }: Props) => {
  const reduced = useReducedMotion() ?? false;
  const filled = BAND_DOTS[band];

  return (
    <span
      className={`flex items-center gap-2 text-[0.6875rem] font-semibold tracking-[0.14em] ${
        dimmed ? "text-muted-foreground/60" : "text-muted-foreground"
      }`}
    >
      {band}
      <span className="flex items-center gap-1" aria-hidden="true">
        {[0, 1, 2].map((index) => (
          <span
            key={index}
            // Only where no fill covers it — the dimmed fill is translucent and would tint.
            className={`relative block h-1.5 w-2.5 rounded-full ${
              index < filled ? "" : "bg-muted-foreground/25"
            }`}
          >
            {index < filled && (
              // Only filled dots step in, and never when dimmed — a past result is no reveal.
              <motion.span
                className={`absolute inset-0 rounded-full ${
                  dimmed ? "bg-primary/40" : "bg-primary"
                }`}
                initial={entranceFrom(!dimmed, reduced, DOT_ENTRANCE)}
                animate={{ opacity: 1, scale: 1 }}
                transition={staggeredTransition("quick", index, {
                  step: DOT_STEP,
                  reduced,
                })}
              />
            )}
          </span>
        ))}
      </span>
    </span>
  );
};

export default DifficultyMeter;
