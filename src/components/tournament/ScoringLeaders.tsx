"use client";

import React from "react";
import { AnimatePresence, motion } from "motion/react";
import { transitionFor } from "@/lib/motion";
import type { SeriesSideView } from "@/lib/tournament-view";
import type { ScoringLine } from "@/types/match";

type Props = {
  home: SeriesSideView;
  away: SeriesSideView;
  leaders: { home: ScoringLine[]; away: ScoringLine[] };
};

const SideColumn = ({
  side,
  lines,
}: {
  side: SeriesSideView;
  lines: ScoringLine[];
}) => (
  <div className="min-w-0">
    <h4
      className={`text-[0.625rem] font-bold tracking-[0.14em] break-words uppercase ${
        side.isSquad ? "text-primary" : "text-muted-foreground"
      }`}
    >
      {side.name}
    </h4>
    <ul className="relative mt-2 flex flex-col gap-2">
      {lines.length === 0 && (
        <li className="text-muted-foreground text-xs">No points yet</li>
      )}
      {/* Entering and leaving the top three fades; moving within it slides.
          `layout` is disabled outright under reduced motion by MotionConfig.
          `popLayout` is load-bearing: a departing leader and its replacement
          overlap, and in the default mode both sit in flow, growing a
          three-row list to four and bouncing the column 44px. */}
      <AnimatePresence initial={false} mode="popLayout">
        {lines.map((line) => (
          <motion.li
            key={line.playerSeasonId}
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={transitionFor("quick")}
            className="bg-court flex items-center justify-between gap-2 rounded-lg px-3 py-2"
          >
            {/* The column heading already names the side, so the accent goes on
                the points. `PeriodBreakCard` accents the name instead — one
                mixed list, where the name is the only side signal. */}
            <span className="text-foreground min-w-0 truncate text-sm">
              {line.playerName}
            </span>
            <span
              className={`shrink-0 text-sm font-bold tabular-nums ${
                side.isSquad ? "text-primary" : "text-foreground"
              }`}
            >
              {line.points}
            </span>
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  </div>
);

const ScoringLeaders = ({ home, away, leaders }: Props) => (
  <div className="bg-card shadow-panel rounded-2xl px-4 py-4">
    <p className="text-muted-foreground text-[0.625rem] font-semibold tracking-[0.18em]">
      SCORING LEADERS · POINTS
    </p>
    <div className="mt-4 grid grid-cols-2 gap-4 xl:grid-cols-1 xl:gap-5">
      <SideColumn side={home} lines={leaders.home} />
      <SideColumn side={away} lines={leaders.away} />
    </div>
  </div>
);

export default ScoringLeaders;
