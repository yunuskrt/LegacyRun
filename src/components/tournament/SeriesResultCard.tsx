"use client";

import React from "react";
import { motion, useReducedMotion } from "motion/react";
import { Trophy } from "lucide-react";
import TeamCrest from "@/components/tournament/TeamCrest";
import {
  FADE_RISE,
  entranceFrom,
  staggeredTransition,
  transitionFor,
} from "@/lib/motion";
import { ROUND_LABELS } from "@/lib/bracket";
import { squadGameLines } from "@/lib/series-flow";
import {
  SQUAD_SHORT_CODE,
  squadSeriesScore,
  squadSideOf,
} from "@/lib/tournament-view";
import type { BracketMatchup, BracketOpponent } from "@/types/bracket";
import type { SeriesState } from "@/types/match";

type Props = {
  matchup: BracketMatchup;
  series: SeriesState;
  squadName: string;
  opponent: BracketOpponent | null;
  ctaLabel: string;
  onContinue: () => void;
};

// The series is over by the time this renders, so the full list reveals nothing.
const SeriesResultCard = ({
  matchup,
  series,
  squadName,
  opponent,
  ctaLabel,
  onContinue,
}: Props) => {
  const reduced = useReducedMotion() ?? false;
  const squadWon = series.winner === squadSideOf(matchup);
  const { squadWins, opponentWins } = squadSeriesScore(matchup, series);
  const lines = squadGameLines(matchup, series.games);

  return (
    // No exit — `TournamentStage`'s crossfade already covers the return to the bracket.
    <motion.div
      className="mx-auto w-full max-w-xl"
      initial={entranceFrom(true, reduced, FADE_RISE.initial)}
      animate={FADE_RISE.animate}
      transition={transitionFor("base", reduced)}
    >
      <div
        className={`bg-card rounded-2xl border px-5 py-6 sm:px-6 ${
          squadWon ? "border-primary shadow-trophy" : "border-destructive/70"
        }`}
      >
        <p className="text-primary flex items-center justify-center gap-2 text-[0.625rem] font-bold tracking-[0.18em]">
          {squadWon && <Trophy className="size-4" aria-hidden="true" />}
          {ROUND_LABELS[matchup.round].toUpperCase()}
        </p>

        <h2
          className={`mt-3 text-center text-3xl font-bold tracking-wide uppercase sm:text-4xl ${
            squadWon ? "text-primary" : "text-destructive"
          }`}
        >
          {squadWon ? "Series won" : "Series lost"} {squadWins}-{opponentWins}
        </h2>

        <div className="mt-6 flex items-start justify-center gap-6">
          <div className="flex min-w-0 flex-1 flex-col items-center gap-2">
            <TeamCrest code={SQUAD_SHORT_CODE} isSquad size="lg" />
            <p className="text-primary text-xs font-bold tracking-wide break-words uppercase">
              {squadName}
            </p>
          </div>
          <span className="text-muted-foreground mt-4 text-[0.625rem] font-bold tracking-[0.18em]">
            VS
          </span>
          <div className="flex min-w-0 flex-1 flex-col items-center gap-2">
            <TeamCrest
              code={opponent?.teamSlug ?? "—"}
              isSquad={false}
              size="lg"
            />
            <p className="text-foreground text-xs font-semibold break-words">
              {opponent
                ? `${opponent.seasonYear} ${opponent.teamName}`
                : "Opponent"}
            </p>
          </div>
        </div>

        <p className="text-muted-foreground mt-6 text-[0.625rem] font-bold tracking-[0.18em]">
          GAME BY GAME
        </p>
        <ul className="mt-2 flex flex-col gap-1.5">
          {lines.map((line, index) => (
            <motion.li
              key={line.key}
              initial={entranceFrom(true, reduced, FADE_RISE.initial)}
              animate={FADE_RISE.animate}
              transition={staggeredTransition("base", index, { reduced })}
              className="bg-court flex items-center justify-between gap-3 rounded-lg px-3 py-2"
            >
              <span className="text-muted-foreground text-[0.625rem] font-bold tracking-[0.14em]">
                GAME {line.gameNumber}
              </span>
              <span
                className={`text-sm font-bold tabular-nums ${
                  line.won ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {line.squadPoints}-{line.opponentPoints}
                {line.overtimes > 0 && (
                  <span className="ml-1 text-[0.625rem] font-semibold">
                    {line.overtimes > 1 ? `${line.overtimes}OT` : "OT"}
                  </span>
                )}
              </span>
            </motion.li>
          ))}
        </ul>

        <button
          type="button"
          onClick={onContinue}
          className={`mt-6 min-h-11 w-full rounded-lg px-4 py-3 text-xs font-bold tracking-[0.16em] uppercase ${
            squadWon
              ? "bg-gold text-primary-foreground"
              : "border-border text-foreground border"
          }`}
        >
          {ctaLabel}
        </button>
      </div>
    </motion.div>
  );
};

export default SeriesResultCard;
