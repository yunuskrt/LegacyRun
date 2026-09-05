"use client";

import React from "react";
import { motion, useReducedMotion } from "motion/react";
import { FADE_RISE, entranceFrom, sequencedTransition } from "@/lib/motion";
import { opponentLabel } from "@/lib/run-summary";
import type { RunPathRow } from "@/lib/run-summary";

type Props = {
  path: readonly RunPathRow[];
  section: number;
};

const RunPathList = ({ path, section }: Props) => {
  const reduced = useReducedMotion() ?? false;

  return (
    <section className="border-border/70 bg-card/60 flex flex-col rounded-2xl border px-4 py-4 sm:px-5 sm:py-5">
      <h2 className="text-muted-foreground text-[0.625rem] font-semibold tracking-[0.18em]">
        THE PATH
      </h2>

      <ul className="mt-4 flex flex-col gap-2">
        {/* `staggerDelay` returns 0 at index 0, so a one-row path fades by construction. */}
        {path.map((row, index) => (
          <motion.li
            key={row.round}
            initial={entranceFrom(true, reduced, FADE_RISE.initial)}
            animate={FADE_RISE.animate}
            transition={sequencedTransition("base", section, index, {
              reduced,
            })}
            className="bg-court flex items-center justify-between gap-3 rounded-lg px-3 py-2.5"
          >
            <div className="min-w-0">
              <p className="text-muted-foreground text-[0.625rem] font-semibold tracking-[0.16em]">
                {row.label.toUpperCase()}
              </p>
              <p className="text-foreground text-sm font-semibold break-words">
                {opponentLabel(row.opponent)}
              </p>
            </div>
            {/* The badge arrives with its row, never on its own. */}
            <span
              className={`shrink-0 rounded-full px-2.5 py-0.5 text-[0.625rem] font-bold tabular-nums ${
                row.won
                  ? "bg-primary text-primary-foreground"
                  : "bg-destructive text-primary-foreground"
              }`}
            >
              {row.squadWins}-{row.opponentWins}
            </span>
          </motion.li>
        ))}
      </ul>
    </section>
  );
};

export default RunPathList;
