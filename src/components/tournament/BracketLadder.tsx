"use client";

import React from "react";
import { motion, useReducedMotion } from "motion/react";
import MatchupCard from "@/components/tournament/MatchupCard";
import FinalsChampionStub from "@/components/tournament/FinalsChampionStub";
import { FADE_RISE, entranceFrom, staggeredTransition } from "@/lib/motion";
import {
  isChampionUnlocking,
  matchupCardState,
  roundMotionFor,
} from "@/lib/tournament-view";
import type {
  BracketOpponent,
  BracketRound,
  BracketRoundId,
} from "@/types/bracket";
import type { Conference } from "@/types/game";
import type { Squad } from "@/types/game";
import type { SeriesState } from "@/types/match";

type Props = {
  rounds: BracketRound[];
  squad: Squad;
  series: readonly SeriesState[];
  nextMatchupId: string | null;
  farConference: Conference;
  finalsOpponent: BracketOpponent | null;
  roundsUntilFinals: number;
  revealedThrough: BracketRoundId | null;
  // The archive: the run is over, so no matchup is "next", nothing here is an
  // affordance, and nothing is being revealed.
  readOnly?: boolean;
};

const BracketLadder = ({
  rounds,
  squad,
  series,
  nextMatchupId,
  farConference,
  finalsOpponent,
  roundsUntilFinals,
  revealedThrough,
  readOnly = false,
}: Props) => {
  const reduced = useReducedMotion() ?? false;

  return (
    <div className="grid grid-cols-1 gap-x-10 gap-y-8 md:grid-cols-2 lg:grid-cols-4">
      {rounds.map((round, columnIndex) => {
        const motionKind = roundMotionFor(round.id, revealedThrough, readOnly);

        return (
          <section
            key={round.id}
            className={`relative flex flex-col gap-5 ${
              columnIndex > 0
                ? "lg:before:bg-border/70 lg:before:absolute lg:before:top-1/2 lg:before:-left-6 lg:before:h-px lg:before:w-6 lg:before:content-['']"
                : ""
            }`}
          >
            <h3 className="text-muted-foreground text-[0.625rem] font-semibold tracking-[0.18em]">
              {round.label.toUpperCase()}
            </h3>

            <div className="flex flex-1 flex-col justify-around gap-5">
              {round.matchups.map((matchup, index) => (
                <motion.div
                  key={matchup.id}
                  // Opacity and transform only — the connector ticks sit at each
                  // column's midpoint, so an animated height would move them.
                  initial={entranceFrom(
                    motionKind === "REVEALING",
                    reduced,
                    FADE_RISE.initial
                  )}
                  animate={FADE_RISE.animate}
                  transition={staggeredTransition("base", index, { reduced })}
                >
                  <MatchupCard
                    matchup={matchup}
                    state={matchupCardState(
                      matchup,
                      readOnly ? null : nextMatchupId
                    )}
                    squad={squad}
                    series={series}
                    resolving={motionKind === "RESOLVING"}
                  />
                </motion.div>
              ))}

              {round.id === "NBA_FINALS" && (
                <FinalsChampionStub
                  conference={farConference}
                  opponent={finalsOpponent}
                  roundsAway={roundsUntilFinals}
                  unlocking={isChampionUnlocking(
                    revealedThrough,
                    finalsOpponent,
                    readOnly
                  )}
                />
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
};

export default BracketLadder;
