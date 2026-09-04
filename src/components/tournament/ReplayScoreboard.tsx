"use client";

import React from "react";
import { motion, useAnimationControls, useReducedMotion } from "motion/react";
import TeamLogoBadge from "@/components/draft/TeamLogoBadge";
import TeamCrest from "@/components/tournament/TeamCrest";
import TweenNumber from "@/components/tournament/TweenNumber";
import { transitionFor } from "@/lib/motion";
import { periodLabel } from "@/lib/replay";
import type { SeriesSideView } from "@/lib/tournament-view";
import type { ReplayStatus } from "@/hooks/useReplay";

type Props = {
  home: SeriesSideView;
  away: SeriesSideView;
  homeScore: number;
  awayScore: number;
  period: number;
  clock: string;
  status: ReplayStatus;
  // The cursor a lead change landed on, or null. A cursor rather than a boolean
  // so two flips in a row are two distinct flashes.
  leadChangeAt: number | null;
};

// Opacity only. The colour change is the leader switching to `text-primary` on
// the same event; a scale on numerals this size reads as a jolt.
const FLASH_FROM = { opacity: 0.3 };
const FLASH_TO = { opacity: 1 };

const SideCrest = ({ side }: { side: SeriesSideView }) =>
  side.isSquad || !side.teamLogo ? (
    <TeamCrest code={side.code} isSquad={side.isSquad} size="md" />
  ) : (
    <TeamLogoBadge teamName={side.name} teamLogo={side.teamLogo} size="sm" />
  );

const ReplayScoreboard = ({
  home,
  away,
  homeScore,
  awayScore,
  period,
  clock,
  status,
  leadChangeAt,
}: Props) => {
  const reduced = useReducedMotion() ?? false;
  const homeFlash = useAnimationControls();
  const awayFlash = useAnimationControls();
  const leader =
    homeScore === awayScore ? null : homeScore > awayScore ? "HOME" : "AWAY";

  React.useEffect(() => {
    if (leadChangeAt === null || reduced || leader === null) return;

    const flash = leader === "HOME" ? homeFlash : awayFlash;

    // Starting a new animation on the same element replaces the running one, so
    // a cluster of flips reads as a cluster of flashes rather than a queue.
    flash.set(FLASH_FROM);
    flash.start(FLASH_TO);
  }, [leadChangeAt, leader, reduced, homeFlash, awayFlash]);

  const scoreClass = (side: "HOME" | "AWAY") =>
    `text-[clamp(3.25rem,11cqw,5.5rem)] leading-none font-bold tabular-nums ${
      leader === side ? "text-primary" : "text-foreground"
    }`;

  const periodText =
    status === "FINAL"
      ? "FINAL"
      : status === "PERIOD_BREAK"
        ? `END ${periodLabel(period)}`
        : periodLabel(period);

  return (
    <div className="@container bg-card shadow-panel rounded-2xl px-5 py-6">
      <div className="flex items-start justify-between gap-3">
        <SideCrest side={home} />
        <SideCrest side={away} />
      </div>

      <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div className="min-w-0 text-left">
          <motion.span
            className="block"
            animate={homeFlash}
            transition={transitionFor("quick", reduced)}
          >
            <TweenNumber value={homeScore} className={scoreClass("HOME")} />
          </motion.span>
          <p
            className={`mt-2 text-[0.625rem] font-bold tracking-[0.14em] break-words uppercase ${
              home.isSquad ? "text-primary" : "text-muted-foreground"
            }`}
          >
            {home.name}
          </p>
        </div>

        <div className="text-center">
          <p className="text-foreground text-xl font-bold tracking-[0.1em] sm:text-2xl">
            {periodText}
          </p>
          {status !== "FINAL" && (
            <p className="text-muted-foreground mt-1 text-sm tabular-nums">
              {clock}
            </p>
          )}
        </div>

        <div className="min-w-0 text-right">
          <motion.span
            className="block"
            animate={awayFlash}
            transition={transitionFor("quick", reduced)}
          >
            <TweenNumber value={awayScore} className={scoreClass("AWAY")} />
          </motion.span>
          <p
            className={`mt-2 text-[0.625rem] font-bold tracking-[0.14em] break-words uppercase ${
              away.isSquad ? "text-primary" : "text-muted-foreground"
            }`}
          >
            {away.name}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ReplayScoreboard;
