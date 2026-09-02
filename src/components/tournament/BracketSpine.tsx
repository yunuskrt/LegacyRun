"use client";

import React from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import MatchupCard from "@/components/tournament/MatchupCard";
import FinalsChampionStub from "@/components/tournament/FinalsChampionStub";
import { FADE_RISE, entranceFrom, transitionFor } from "@/lib/motion";
import {
  isChampionUnlocking,
  matchupCardState,
  roundMotionFor,
} from "@/lib/tournament-view";
import { isSquadMatchup } from "@/lib/match";
import type {
  BracketOpponent,
  BracketRound,
  BracketRoundId,
} from "@/types/bracket";
import type { Conference, Squad } from "@/types/game";
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
  // The archive: the run is over, so no matchup is "next" and the whole
  // bracket opens expanded — there is nothing left to spoil.
  readOnly?: boolean;
};

const BracketSpine = ({
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
  const [showFull, setShowFull] = React.useState(readOnly);
  const activeMatchupId = readOnly ? null : nextMatchupId;
  const reduced = useReducedMotion() ?? false;

  return (
    <div className="flex flex-col gap-6">
      <ol className="border-border/60 flex flex-col gap-6 border-l pl-5">
        {rounds.map((round) => {
          const squadMatchup = round.matchups.find(isSquadMatchup) ?? null;
          const isNext = squadMatchup?.id === activeMatchupId;
          const others = showFull
            ? round.matchups.filter((matchup) => !isSquadMatchup(matchup))
            : [];
          const motionKind = roundMotionFor(
            round.id,
            revealedThrough,
            readOnly
          );

          return (
            <li key={round.id} className="relative">
              <span
                className={`absolute top-1.5 -left-[1.5625rem] size-2.5 rounded-full border ${
                  isNext
                    ? "border-primary bg-primary"
                    : "border-border bg-background"
                }`}
                aria-hidden="true"
              />
              <h3
                className={`mb-2 text-[0.625rem] font-semibold tracking-[0.18em] ${
                  isNext ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {round.label.toUpperCase()}
              </h3>

              <div className="flex flex-col gap-3">
                {squadMatchup ? (
                  // The reveal is the spine row, not a desktop column, but it
                  // reads the same rule.
                  <motion.div
                    initial={entranceFrom(
                      motionKind === "REVEALING",
                      reduced,
                      FADE_RISE.initial
                    )}
                    animate={FADE_RISE.animate}
                    transition={transitionFor("base", reduced)}
                  >
                    <MatchupCard
                      matchup={squadMatchup}
                      state={matchupCardState(squadMatchup, activeMatchupId)}
                      squad={squad}
                      series={series}
                      compact
                      resolving={motionKind === "RESOLVING"}
                    />
                  </motion.div>
                ) : (
                  <div className="border-border/60 text-muted-foreground flex min-h-24 items-center justify-center rounded-xl border border-dashed px-4 py-5 text-[0.6875rem] font-semibold tracking-[0.18em]">
                    AWAITING WINNER
                  </div>
                )}

                {/* One height transition for the whole round's siblings — a
                    per-item stagger turns a four-round expand into a cascade. */}
                <AnimatePresence initial={false}>
                  {others.length > 0 && (
                    <motion.div
                      key="others"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={transitionFor("base", reduced)}
                      className="overflow-hidden"
                    >
                      {/* The parent's gap already separates this wrapper from
                          the squad card, so the inner spacing is between the
                          siblings only. */}
                      <div className="flex flex-col gap-3">
                        {others.map((matchup) => (
                          <MatchupCard
                            key={matchup.id}
                            matchup={matchup}
                            state={matchupCardState(matchup, activeMatchupId)}
                            squad={squad}
                            series={series}
                            compact
                            resolving={motionKind === "RESOLVING"}
                          />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

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
            </li>
          );
        })}
      </ol>

      <button
        type="button"
        onClick={() => setShowFull((current) => !current)}
        className="border-border text-muted-foreground min-h-11 rounded-lg border px-4 py-3 text-xs font-semibold tracking-[0.14em] uppercase"
      >
        {showFull ? "Hide full bracket" : "Show full bracket"}
      </button>
    </div>
  );
};

export default BracketSpine;
