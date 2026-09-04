"use client";

import React from "react";
import { motion, useReducedMotion } from "motion/react";
import { Trophy } from "lucide-react";
import TweenNumber from "@/components/tournament/TweenNumber";
import { DURATION, EASE, transitionFor } from "@/lib/motion";

type Props = {
  filledSlots: number;
  totalSlots: number;
};

// Hoisted so the reference is stable — an inline array is a new target on every
// render, which motion would replay as a fresh pulse.
const COMPLETE_PULSE = [1, 1.06, 1];

const DraftTopBar = ({ filledSlots, totalSlots }: Props) => {
  const reduced = useReducedMotion() ?? false;
  const isComplete = filledSlots >= totalSlots;

  return (
    <header className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <span className="bg-gold shadow-trophy flex size-12 shrink-0 items-center justify-center rounded-2xl sm:size-14">
          <Trophy
            className="text-primary-foreground size-6 sm:size-7"
            strokeWidth={2.25}
          />
        </span>
        <div className="min-w-0">
          <p className="text-xl leading-tight font-bold tracking-[0.18em] sm:text-2xl">
            LEGACYRUN
          </p>
          <p className="text-muted-foreground text-sm sm:text-base">
            Draft Room · 1980–2026
          </p>
        </div>
      </div>

      <div className="shrink-0 text-right">
        <p className="text-muted-foreground text-xs tracking-[0.16em] uppercase sm:text-sm">
          Slots Filled
        </p>
        <p className="text-primary text-xl font-bold sm:text-2xl">
          <TweenNumber value={filledSlots} />/{totalSlots}
        </p>
        {/* Segments fill by count, never by slot identity: indexing them by
            slot would leave gaps under a "5/5" caption if C were drafted
            first, and the court already shows which slot is which. */}
        <motion.div
          // Segments flex to whatever the column already is, so the bar can
          // never widen the header — at 390 an intrinsically-sized one pushed
          // the page into a horizontal scroll.
          className="mt-1.5 flex w-full items-center justify-end gap-1"
          aria-hidden="true"
          animate={{ scale: isComplete && !reduced ? COMPLETE_PULSE : 1 }}
          transition={{ duration: DURATION.slow, ease: EASE.enter }}
        >
          {Array.from({ length: totalSlots }, (_, index) => (
            <span
              key={index}
              className="bg-muted-foreground/25 block h-1.5 max-w-7 min-w-0 flex-1 overflow-hidden rounded-full"
            >
              <motion.span
                className="bg-gold block h-full w-full origin-left rounded-full"
                initial={false}
                animate={{ scaleX: index < filledSlots ? 1 : 0 }}
                transition={transitionFor("base", reduced)}
              />
            </span>
          ))}
        </motion.div>
      </div>
    </header>
  );
};

export default DraftTopBar;
