"use client";

import React from "react";
import GameReplay from "@/components/tournament/GameReplay";
import SeriesFaceOff from "@/components/tournament/SeriesFaceOff";
import SeriesResultCard from "@/components/tournament/SeriesResultCard";
import { useAutoAdvance } from "@/hooks/useAutoAdvance";
import { ROUND_LABELS } from "@/lib/bracket";
import { seriesWinsThrough } from "@/lib/replay";
import {
  NO_ADVANCE,
  isSeriesEnd,
  seriesStageOf,
  stageAdvance,
} from "@/lib/series-flow";
import {
  opponentOf,
  seriesSides,
  squadDisplayName,
} from "@/lib/tournament-view";
import type { ReplaySpeed } from "@/lib/replay";
import type { ReplayMode } from "@/lib/series-flow";
import type { BracketMatchup } from "@/types/bracket";
import type { Squad } from "@/types/game";
import type { SeriesState } from "@/types/match";

type Props = {
  matchup: BracketMatchup;
  series: SeriesState;
  squad: Squad;
  speed: ReplaySpeed;
  mode: ReplayMode;
  ctaLabel: string;
  onSpeedChange: (speed: ReplaySpeed) => void;
  onModeChange: (mode: ReplayMode) => void;
  onContinue: () => void;
};

const SeriesReplay = ({
  matchup,
  series,
  squad,
  speed,
  mode,
  ctaLabel,
  onSpeedChange,
  onModeChange,
  onContinue,
}: Props) => {
  // This component's lifetime is the series, so only game 1 ever sees `false`.
  const [tipped, setTipped] = React.useState(false);
  const [gameIndex, setGameIndex] = React.useState(0);

  const sides = seriesSides(matchup, squad);
  const opponent = opponentOf(matchup);
  const squadName = squadDisplayName(squad);
  const game = series.games[gameIndex];

  const tip = React.useCallback(() => setTipped(true), []);
  const nextGame = React.useCallback(
    () => setGameIndex((current) => current + 1),
    []
  );

  const stage = seriesStageOf(tipped, Boolean(game), matchup, series);
  const advance = stageAdvance(stage, mode);

  useAutoAdvance(stage === "FACE_OFF" ? advance : NO_ADVANCE, tip);
  useAutoAdvance(isSeriesEnd(stage) ? advance : NO_ADVANCE, onContinue);

  if (stage === "FACE_OFF") {
    return (
      <SeriesFaceOff
        round={matchup.round}
        squad={squad}
        squadName={squadName}
        opponent={opponent}
      />
    );
  }

  // `games.length` decides the hand-off only; it must never reach the screen.
  if (!game) {
    return (
      <SeriesResultCard
        matchup={matchup}
        series={series}
        squadName={squadName}
        opponent={opponent}
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
        speed={speed}
        mode={mode}
        ctaLabel={
          gameIndex === series.games.length - 1
            ? "See the series result"
            : "Next game"
        }
        onSpeedChange={onSpeedChange}
        onModeChange={onModeChange}
        onFinish={nextGame}
      />
    </div>
  );
};

export default SeriesReplay;
