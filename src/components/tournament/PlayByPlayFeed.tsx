"use client";

import React from "react";
import { AnimatePresence, motion } from "motion/react";
import { periodLabel } from "@/lib/replay";
import type { FeedBadge, FeedRow } from "@/lib/replay";
import type { SeriesSideView } from "@/lib/tournament-view";

type Props = {
  rows: FeedRow[];
  home: SeriesSideView;
  away: SeriesSideView;
};

const BADGE_STYLE: Record<FeedBadge, string> = {
  AND_ONE: "border-border text-muted-foreground",
  LEAD_CHANGE: "border-border text-muted-foreground",
  RUN: "bg-primary text-primary-foreground border-primary",
};

const badgeLabel = (badge: FeedBadge, row: FeedRow): string =>
  badge === "AND_ONE"
    ? "AND-1"
    : badge === "LEAD_CHANGE"
      ? "LEAD CHANGE"
      : (row.runLabel ?? "RUN");

const PlayByPlayFeed = ({ rows, home, away }: Props) => (
  <div className="bg-card shadow-panel flex max-h-[32rem] flex-col rounded-2xl">
    <p className="text-muted-foreground shrink-0 px-4 pt-4 pb-3 text-[0.625rem] font-semibold tracking-[0.18em]">
      PLAY-BY-PLAY
    </p>

    <ul className="flex flex-1 flex-col overflow-y-auto px-2 pb-3">
      {rows.length === 0 && (
        <li className="text-muted-foreground px-2 py-3 text-xs">
          Waiting for the tip-off…
        </li>
      )}

      <AnimatePresence initial={false}>
        {rows.map((row) => {
          const side = row.side === "HOME" ? home : away;

          return (
            <motion.li
              key={row.key}
              layout
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="border-border/40 flex items-center gap-2 border-b px-2 py-2 last:border-b-0"
            >
              <span className="text-muted-foreground w-16 shrink-0 text-[0.6875rem] tabular-nums">
                {row.clock} {periodLabel(row.period)}
              </span>

              <span className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
                <span
                  className={`truncate text-xs font-medium ${
                    side.isSquad ? "text-primary" : "text-foreground"
                  }`}
                >
                  {row.playerName} +{row.points}
                </span>
                {row.badges.map((badge) => (
                  <span
                    key={badge}
                    className={`rounded-full border px-1.5 py-0.5 text-[0.5625rem] font-bold tracking-[0.1em] ${BADGE_STYLE[badge]}`}
                  >
                    {badgeLabel(badge, row)}
                  </span>
                ))}
              </span>

              <span className="text-foreground shrink-0 text-xs font-bold tabular-nums">
                {row.homeScore}-{row.awayScore}
              </span>
            </motion.li>
          );
        })}
      </AnimatePresence>
    </ul>
  </div>
);

export default PlayByPlayFeed;
