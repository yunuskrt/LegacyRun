"use client";

import React from "react";
import { motion } from "motion/react";
import { transitionFor } from "@/lib/motion";
import { periodBreakLabel } from "@/lib/replay";
import type { PeriodSummary } from "@/lib/replay";
import type { SeriesSideView } from "@/lib/tournament-view";

type Props = {
  summary: PeriodSummary;
  home: SeriesSideView;
  away: SeriesSideView;
};

const PeriodBreakCard = ({ summary, home, away }: Props) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.96 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.96 }}
    transition={transitionFor("quick")}
    className="border-primary bg-card shadow-trophy w-full max-w-sm rounded-2xl border px-6 py-6 text-center"
    role="status"
  >
    <p className="text-primary text-[0.6875rem] font-bold tracking-[0.18em]">
      {periodBreakLabel(summary.period)}
    </p>
    <p className="text-foreground mt-3 text-4xl font-bold tabular-nums">
      {summary.home}-{summary.away}
    </p>
    <p className="text-muted-foreground mt-1 text-xs">Quarter score</p>

    <p className="text-muted-foreground mt-6 text-left text-[0.625rem] font-semibold tracking-[0.18em]">
      PERIOD LEADERS
    </p>
    <ul className="mt-2 flex flex-col gap-2">
      {summary.leaders.length === 0 && (
        <li className="text-muted-foreground text-xs">No points scored</li>
      )}
      {summary.leaders.map((line) => {
        const side = line.side === "HOME" ? home : away;

        return (
          <li
            key={`${line.side}-${line.playerSeasonId}`}
            className="bg-court flex items-center justify-between gap-2 rounded-lg px-3 py-2"
          >
            {/* Both sides share one list here, so the name carries the squad
                accent — it is the only thing saying whose player this is.
                `ScoringLeaders` accents the points instead, because its headed
                columns have already answered that. */}
            <span
              className={`min-w-0 truncate text-sm ${
                side.isSquad ? "text-primary" : "text-foreground"
              }`}
            >
              {line.playerName}
            </span>
            <span className="text-foreground shrink-0 text-sm font-bold tabular-nums">
              {line.points}
            </span>
          </li>
        );
      })}
    </ul>
  </motion.div>
);

export default PeriodBreakCard;
