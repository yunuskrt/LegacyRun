import React from "react";
import MatchupCard from "@/components/tournament/MatchupCard";
import FinalsChampionStub from "@/components/tournament/FinalsChampionStub";
import { matchupCardState } from "@/lib/tournament-view";
import type { BracketOpponent, BracketRound } from "@/types/bracket";
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
  // The archive: the run is over, so no matchup is "next" and nothing here is
  // an affordance.
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
  readOnly = false,
}: Props) => (
  <div className="grid grid-cols-1 gap-x-10 gap-y-8 md:grid-cols-2 lg:grid-cols-4">
    {rounds.map((round, columnIndex) => (
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
          {round.matchups.map((matchup) => (
            <MatchupCard
              key={matchup.id}
              matchup={matchup}
              state={matchupCardState(matchup, readOnly ? null : nextMatchupId)}
              squad={squad}
              series={series}
            />
          ))}

          {round.id === "NBA_FINALS" && (
            <FinalsChampionStub
              conference={farConference}
              opponent={finalsOpponent}
              roundsAway={roundsUntilFinals}
            />
          )}
        </div>
      </section>
    ))}
  </div>
);

export default BracketLadder;
