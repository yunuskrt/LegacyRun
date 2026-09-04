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

// Low enough that up to ten meters can fill at once without the screen reading
// as a cascade — three dots land in ~120ms.
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
            // The track only paints where no fill covers it: the dimmed fill is
            // semi-transparent, so leaving a track underneath would tint it.
            className={`relative block h-1.5 w-2.5 rounded-full ${
              index < filled ? "" : "bg-muted-foreground/25"
            }`}
          >
            {index < filled && (
              // Only the filled dots step in; the track is always there, or the
              // meter reads as three dots appearing rather than a level being
              // set. A past result is not a reveal, so `dimmed` does not play.
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
