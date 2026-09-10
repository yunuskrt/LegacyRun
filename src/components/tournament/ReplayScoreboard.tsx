"use client";

import React from "react";
import { motion, useAnimationControls, useReducedMotion } from "motion/react";
import TeamLogoBadge from "@/components/draft/TeamLogoBadge";
import TeamCrest from "@/components/tournament/TeamCrest";
import TweenNumber from "@/components/tournament/TweenNumber";
import { transitionFor } from "@/lib/motion";
import { periodLabel } from "@/lib/replay";
import { bySide } from "@/lib/tournament-view";
import type { SeriesSideView, SidePair } from "@/lib/tournament-view";
import type { ReplayStatus } from "@/hooks/useReplay";

type Props = {
  // Host first — the pair swaps when the series changes venue.
  first: SeriesSideView;
  second: SeriesSideView;
  scores: SidePair<number>;
  period: number;
  clock: string;
  status: ReplayStatus;
  // A cursor, not a boolean, so two flips in a row are two distinct flashes.
  leadChangeAt: number | null;
};

// Opacity only — a scale on numerals this size reads as a jolt.
const FLASH_FROM = { opacity: 0.3 };
const FLASH_TO = { opacity: 1 };

const SideCrest = ({ side }: { side: SeriesSideView }) =>
  side.isSquad || !side.teamLogo ? (
    <TeamCrest code={side.code} isSquad={side.isSquad} size="md" />
  ) : (
    <TeamLogoBadge teamName={side.name} teamLogo={side.teamLogo} size="sm" />
  );

const ReplayScoreboard = ({
  first,
  second,
  scores,
  period,
  clock,
  status,
  leadChangeAt,
}: Props) => {
  const reduced = useReducedMotion() ?? false;
  const firstFlash = useAnimationControls();
  const secondFlash = useAnimationControls();
  const firstScore = bySide(scores, first.id);
  const secondScore = bySide(scores, second.id);
  const leader =
    firstScore === secondScore
      ? null
      : firstScore > secondScore
        ? first.id
        : second.id;

  React.useEffect(() => {
    if (leadChangeAt === null || reduced || leader === null) return;

    const flash = leader === first.id ? firstFlash : secondFlash;

    // A new animation replaces the running one, so flips flash rather than queue.
    flash.set(FLASH_FROM);
    flash.start(FLASH_TO);
  }, [leadChangeAt, leader, reduced, first.id, firstFlash, secondFlash]);

  const scoreClass = (side: SeriesSideView) =>
    `text-[clamp(2.75rem,9cqw,4.5rem)] leading-none font-bold tabular-nums ${
      leader === side.id ? "text-primary" : "text-foreground"
    }`;

  const periodText =
    status === "FINAL"
      ? "FINAL"
      : status === "PERIOD_BREAK"
        ? `END ${periodLabel(period)}`
        : periodLabel(period);

  return (
    <div className="@container bg-card shadow-panel rounded-2xl px-5 py-3">
      <div className="flex items-start justify-between gap-3">
        <SideCrest side={first} />
        <SideCrest side={second} />
      </div>

      <div className="mt-2 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div className="min-w-0 text-left">
          <motion.span
            className="block"
            animate={firstFlash}
            transition={transitionFor("quick", reduced)}
          >
            <TweenNumber value={firstScore} className={scoreClass(first)} />
          </motion.span>
          <p
            className={`mt-1.5 text-[0.625rem] font-bold tracking-[0.14em] break-words uppercase ${
              first.isSquad ? "text-primary" : "text-muted-foreground"
            }`}
          >
            {first.name}
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
            animate={secondFlash}
            transition={transitionFor("quick", reduced)}
          >
            <TweenNumber value={secondScore} className={scoreClass(second)} />
          </motion.span>
          <p
            className={`mt-1.5 text-[0.625rem] font-bold tracking-[0.14em] break-words uppercase ${
              second.isSquad ? "text-primary" : "text-muted-foreground"
            }`}
          >
            {second.name}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ReplayScoreboard;
