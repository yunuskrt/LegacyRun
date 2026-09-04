"use client";

import React from "react";
import { motion, useReducedMotion } from "motion/react";
import { Crown, ShieldOff } from "lucide-react";
import RunPathList from "@/components/tournament/RunPathList";
import RunRecapStats from "@/components/tournament/RunRecapStats";
import RunSquadGrid from "@/components/tournament/RunSquadGrid";
import {
  FADE_RISE,
  STAGE_STEP,
  entranceFrom,
  sequencedTransition,
  transitionFor,
} from "@/lib/motion";
import {
  CHAMPION_OVERLINE,
  defeatSubtitle,
  eliminationHeadline,
  eliminationRow,
  playoffRecord,
  runPath,
  runScoringLeader,
  signatureGame,
} from "@/lib/run-summary";
import type { Bracket } from "@/types/bracket";
import type { Squad } from "@/types/game";
import type { SeriesState } from "@/types/match";

type Props = {
  bracket: Bracket;
  series: readonly SeriesState[];
  squad: Squad;
  squadName: string;
  isChampion: boolean;
  onReviewBracket: () => void;
  onNewRun: () => void;
};

// Reading order: sections one beat apart, each staggering internally at its own step.
const HEADER = 0;
const SQUAD = 1;
const RECAP = 2;

// The only scale on the screen; defeat gets the identical entrance, being the common case.
const GLYPH_ENTRANCE = { opacity: 0, scale: 0.9 };

const RunResultScreen = ({
  bracket,
  series,
  squad,
  squadName,
  isChampion,
  onReviewBracket,
  onNewRun,
}: Props) => {
  const reduced = useReducedMotion() ?? false;
  const path = runPath(bracket, series);
  const eliminated = eliminationRow(path);

  // Glyph, overline, outcome, name — staged rather than staggered as a list.
  const headerLine = (index: number) => ({
    initial: entranceFrom(true, reduced, FADE_RISE.initial),
    animate: FADE_RISE.animate,
    transition: sequencedTransition("base", HEADER, index, {
      step: STAGE_STEP,
      reduced,
    }),
  });

  const press = reduced
    ? {}
    : { whileHover: { y: -2 }, whileTap: { scale: 0.98 } };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <header className="flex flex-col items-center gap-1 text-center">
        <motion.span
          initial={entranceFrom(true, reduced, GLYPH_ENTRANCE)}
          animate={{ opacity: 1, scale: 1 }}
          transition={sequencedTransition("spring", HEADER, 0, {
            step: STAGE_STEP,
            reduced,
          })}
        >
          {isChampion ? (
            <Crown className="text-primary size-8" aria-hidden="true" />
          ) : (
            <ShieldOff className="text-destructive size-8" aria-hidden="true" />
          )}
        </motion.span>

        <motion.p
          {...headerLine(1)}
          className={`text-[0.6875rem] font-bold tracking-[0.18em] ${
            isChampion ? "text-primary" : "text-destructive"
          }`}
        >
          {isChampion ? CHAMPION_OVERLINE : eliminationHeadline(eliminated)}
        </motion.p>

        <motion.h1
          {...headerLine(2)}
          className={`text-4xl font-bold tracking-wide uppercase sm:text-5xl ${
            isChampion ? "text-primary" : "text-destructive"
          }`}
        >
          {isChampion ? "NBA Champions" : "Run ended"}
        </motion.h1>

        {/* The hero needs a subject; `squadName` is already the YOUR SQUAD fallback. */}
        <motion.p
          {...headerLine(3)}
          className="text-foreground text-2xl font-bold tracking-wide break-words uppercase sm:text-3xl"
        >
          {squadName}
        </motion.p>

        {eliminated && (
          <motion.p
            {...headerLine(4)}
            className="text-muted-foreground mt-1 text-sm"
          >
            {defeatSubtitle(eliminated)}
          </motion.p>
        )}
      </header>

      <RunSquadGrid players={squad.players} section={SQUAD} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <RunPathList path={path} section={RECAP} />
        <RunRecapStats
          record={playoffRecord(path)}
          leader={runScoringLeader(path)}
          signature={signatureGame(path)}
          isChampion={isChampion}
          section={RECAP}
        />
      </div>

      <motion.div
        initial={entranceFrom(true, reduced, FADE_RISE.initial)}
        animate={FADE_RISE.animate}
        transition={sequencedTransition("base", RECAP, 0, { reduced })}
        className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center"
      >
        {/* Transform only, dropped under reduced motion, which snaps rather than omits. */}
        <motion.button
          type="button"
          onClick={onNewRun}
          {...press}
          transition={transitionFor("quick", reduced)}
          className="bg-gold text-primary-foreground min-h-11 w-full rounded-xl px-6 py-3 text-xs font-bold tracking-[0.16em] uppercase sm:w-auto"
        >
          Start a new run
        </motion.button>
        <motion.button
          type="button"
          onClick={onReviewBracket}
          {...press}
          transition={transitionFor("quick", reduced)}
          className="border-border bg-secondary text-foreground min-h-11 w-full rounded-xl border px-6 py-3 text-xs font-bold tracking-[0.16em] uppercase sm:w-auto"
        >
          Review bracket
        </motion.button>
      </motion.div>
    </div>
  );
};

export default RunResultScreen;
