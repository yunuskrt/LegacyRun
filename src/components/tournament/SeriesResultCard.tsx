import React from "react";
import TeamSlotRow from "@/components/tournament/TeamSlotRow";
import { ROUND_LABELS } from "@/lib/bracket";
import {
  seriesScoreLabel,
  squadSeriesScore,
  squadSideOf,
} from "@/lib/tournament-view";
import type { BracketMatchup } from "@/types/bracket";
import type { Squad } from "@/types/game";
import type { SeriesState } from "@/types/match";

type Props = {
  matchup: BracketMatchup;
  series: SeriesState;
  squad: Squad;
  ctaLabel: string;
  onContinue: () => void;
};

// The Phase 17 seam: a plain, finished result. Phase 17 replaces this with a
// paced replay and Phase 18 wraps it in controls.
const SeriesResultCard = ({
  matchup,
  series,
  squad,
  ctaLabel,
  onContinue,
}: Props) => {
  const squadWon = series.winner === squadSideOf(matchup);
  const { squadWins, opponentWins } = squadSeriesScore(matchup, series);
  const homeScore = seriesScoreLabel(series, "HOME");
  const awayScore = seriesScoreLabel(series, "AWAY");

  return (
    <div className="mx-auto w-full max-w-xl">
      <div
        className={`bg-card rounded-2xl border px-6 py-6 ${
          squadWon ? "border-primary shadow-trophy" : "border-destructive/70"
        }`}
      >
        <p className="text-muted-foreground text-center text-[0.625rem] font-semibold tracking-[0.18em]">
          {ROUND_LABELS[matchup.round].toUpperCase()}
        </p>
        <h2
          className={`mt-2 text-center text-2xl font-bold tracking-wide uppercase ${
            squadWon ? "text-primary" : "text-destructive"
          }`}
        >
          {squadWon ? "Series won" : "Series lost"} {squadWins}-{opponentWins}
        </h2>

        <div className="mt-6 flex flex-col gap-4">
          {matchup.home && (
            <TeamSlotRow
              slot={matchup.home}
              squad={squad}
              scoreLabel={homeScore}
              eliminated={homeScore === null}
              compact
            />
          )}
          {matchup.away && (
            <TeamSlotRow
              slot={matchup.away}
              squad={squad}
              scoreLabel={awayScore}
              eliminated={awayScore === null}
              compact
            />
          )}
        </div>

        <ul className="border-border/70 text-muted-foreground mt-6 space-y-1 border-t pt-4 text-xs">
          {series.games.map((game) => (
            <li key={game.seed} className="flex justify-between gap-3">
              <span>Game {game.gameNumber}</span>
              <span className="text-foreground font-medium">
                {game.homeScore}-{game.awayScore}
                {game.periodScores.length > 4 &&
                  ` (${game.periodScores.length - 4}OT)`}
              </span>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={onContinue}
          className="bg-gold text-primary-foreground mt-6 w-full rounded-lg px-4 py-3 text-xs font-bold tracking-[0.16em] uppercase"
        >
          {ctaLabel}
        </button>
      </div>
    </div>
  );
};

export default SeriesResultCard;
