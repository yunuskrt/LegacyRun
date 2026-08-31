"use client";

import React from "react";
import GameReplay from "@/components/tournament/GameReplay";
import SeriesResultCard from "@/components/tournament/SeriesResultCard";
import { ROUND_LABELS } from "@/lib/bracket";
import { seriesWinsThrough } from "@/lib/replay";
import { seriesSides } from "@/lib/tournament-view";
import type { ReplaySpeed } from "@/lib/replay";
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

// Phase 18 owns the speed control; until then the replay runs at Normal.
const SPEED: ReplaySpeed = "NORMAL";

const SeriesReplay = ({
  matchup,
  series,
  squad,
  ctaLabel,
  onContinue,
}: Props) => {
  const [gameIndex, setGameIndex] = React.useState(0);
  const sides = seriesSides(matchup, squad);
  const game = series.games[gameIndex];
  const isLastGame = gameIndex === series.games.length - 1;

  // Reading `games.length` here would be a leak if it reached the screen; it
  // only ever decides whether this replay hands over to the series card.
  if (!game) {
    return (
      <SeriesResultCard
        matchup={matchup}
        series={series}
        squad={squad}
        ctaLabel={ctaLabel}
        onContinue={onContinue}
      />
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <p className="text-muted-foreground text-center text-[0.625rem] font-semibold tracking-[0.18em]">
        {ROUND_LABELS[matchup.round].toUpperCase()}
      </p>

      <GameReplay
        key={game.seed}
        game={game}
        home={sides.home}
        away={sides.away}
        winsBefore={seriesWinsThrough(series.games, gameIndex)}
        speed={SPEED}
        ctaLabel={isLastGame ? "See the series result" : "Next game"}
        onFinish={() => setGameIndex((current) => current + 1)}
      />
    </div>
  );
};

export default SeriesReplay;
