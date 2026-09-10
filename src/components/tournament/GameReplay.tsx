"use client";

import React from "react";
import { AnimatePresence } from "motion/react";
import LineScoreTable from "@/components/tournament/LineScoreTable";
import MomentumStrip from "@/components/tournament/MomentumStrip";
import PeriodBreakCard from "@/components/tournament/PeriodBreakCard";
import PlayByPlayFeed from "@/components/tournament/PlayByPlayFeed";
import ReplayControlBar from "@/components/tournament/ReplayControlBar";
import ReplayScoreboard from "@/components/tournament/ReplayScoreboard";
import ScoringLeaders from "@/components/tournament/ScoringLeaders";
import SeriesBanner from "@/components/tournament/SeriesBanner";
import { useAutoAdvance } from "@/hooks/useAutoAdvance";
import { useReplay } from "@/hooks/useReplay";
import { periodSummary, winsAtBuzzer } from "@/lib/replay";
import { gameAdvance } from "@/lib/series-flow";
import { hostFirstSides, squadWinsOf } from "@/lib/tournament-view";
import type { ReplaySpeed } from "@/lib/replay";
import type { ReplayMode } from "@/lib/series-flow";
import type { SeriesSideView } from "@/lib/tournament-view";
import type { GameResult } from "@/types/match";

type Props = {
  game: GameResult;
  home: SeriesSideView;
  away: SeriesSideView;
  winsBefore: { home: number; away: number };
  speed: ReplaySpeed;
  mode: ReplayMode;
  ctaLabel: string;
  onSpeedChange: (speed: ReplaySpeed) => void;
  onModeChange: (mode: ReplayMode) => void;
  onFinish: () => void;
};

const GameReplay = ({
  game,
  home,
  away,
  winsBefore,
  speed,
  mode,
  ctaLabel,
  onSpeedChange,
  onModeChange,
  onFinish,
}: Props) => {
  const { frame, cursor, status, jumpToEnd } = useReplay(game, speed);
  // `first` is the host by construction, so the scoreboard follows the series around.
  const { first, second } = hostFirstSides({ home, away }, game.hostSide);
  const scores = { home: frame.homeScore, away: frame.awayScore };

  useAutoAdvance(gameAdvance(status === "FINAL", mode), onFinish);

  const wins = squadWinsOf(
    winsAtBuzzer(
      winsBefore,
      status === "FINAL",
      frame.homeScore,
      frame.awayScore
    ),
    { home, away }
  );

  return (
    // Reserves the pinned control bar's height (141px at 390) so the CTA clears it.
    <div className="flex flex-col gap-4 pb-36 md:pb-0">
      {/* First in the column, but `fixed` below md, so mobile keeps its bottom bar. */}
      <ReplayControlBar
        speed={speed}
        mode={mode}
        canSkip={status !== "FINAL"}
        onSpeedChange={onSpeedChange}
        onModeChange={onModeChange}
        onSkip={jumpToEnd}
      />

      <SeriesBanner
        first={first}
        second={second}
        gameNumber={game.gameNumber}
        hostCode={first.code}
        wins={wins}
      />

      {/* Three columns only from xl — at lg the scoreboard numerals collide. */}
      {/* `grid-cols-1` is load-bearing: the implicit column sizes to max-content. */}
      <div className="relative grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-[minmax(0,17rem)_minmax(0,1fr)_minmax(0,21rem)]">
        <div className="order-4 lg:order-2 xl:order-1">
          <ScoringLeaders
            first={first}
            second={second}
            leaders={frame.leaders}
          />
        </div>

        <div className="order-1 flex flex-col gap-4 lg:col-span-2 xl:order-2 xl:col-span-1">
          <ReplayScoreboard
            first={first}
            second={second}
            scores={scores}
            period={frame.period}
            clock={frame.clock}
            status={status}
            leadChangeAt={frame.leadChange ? cursor : null}
          />
          <LineScoreTable
            cells={frame.lineScore}
            first={first}
            second={second}
            scores={scores}
          />
          {/* Home/away, not first/second — its y-axis polarity is anchored to the slot. */}
          <MomentumStrip
            points={frame.momentum}
            axisEnd={frame.momentumAxis}
            margin={frame.margin}
            home={home}
            away={away}
          />
        </div>

        <div className="order-5 lg:order-3 xl:order-3">
          <PlayByPlayFeed rows={frame.feed} first={first} second={second} />
        </div>

        <AnimatePresence>
          {status === "PERIOD_BREAK" && (
            <div className="bg-background/70 absolute inset-0 z-10 flex items-center justify-center px-4 backdrop-blur-[2px]">
              <PeriodBreakCard
                summary={periodSummary(game.events, cursor)}
                first={first}
                second={second}
              />
            </div>
          )}
        </AnimatePresence>
      </div>

      {status === "FINAL" && (
        <button
          type="button"
          onClick={onFinish}
          className="bg-gold text-primary-foreground min-h-11 w-full rounded-xl px-6 py-3 text-xs font-bold tracking-[0.16em] uppercase"
        >
          {ctaLabel}
        </button>
      )}
    </div>
  );
};

export default GameReplay;
