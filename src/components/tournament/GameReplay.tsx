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
  const [skipped, setSkipped] = React.useState(false);
  const host = game.hostSide === "HOME" ? home : away;

  useAutoAdvance(gameAdvance(status === "FINAL", mode, skipped), onFinish);

  const skip = () => {
    setSkipped(true);
    jumpToEnd();
  };

  const wins = winsAtBuzzer(
    winsBefore,
    status === "FINAL",
    frame.homeScore,
    frame.awayScore
  );

  return (
    // The control bar is pinned to the viewport below md, so the column has to
    // reserve its height or the CTA scrolls underneath it. 144px covers the
    // two-row bar the narrowest widths wrap to (measured 141px at 390).
    <div className="flex flex-col gap-5 pb-36 md:pb-0">
      <SeriesBanner
        home={home}
        away={away}
        gameNumber={game.gameNumber}
        hostCode={host.code}
        wins={wins}
      />

      {/* Three columns only from xl — at lg they squeeze the scoreboard until
          the numerals collide and the line score clips its total. */}
      {/* `grid-cols-1` is load-bearing: without an explicit column the implicit
          one sizes to max-content, and the line score's min-width drags every
          sibling out past the viewport. */}
      <div className="relative grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-[minmax(0,17rem)_minmax(0,1fr)_minmax(0,21rem)]">
        <div className="order-4 lg:order-2 xl:order-1">
          <ScoringLeaders home={home} away={away} leaders={frame.leaders} />
        </div>

        <div className="order-1 flex flex-col gap-5 lg:col-span-2 xl:order-2 xl:col-span-1">
          <ReplayScoreboard
            home={home}
            away={away}
            homeScore={frame.homeScore}
            awayScore={frame.awayScore}
            period={frame.period}
            clock={frame.clock}
            status={status}
            leadChangeAt={frame.leadChange ? cursor : null}
          />
          <LineScoreTable
            cells={frame.lineScore}
            home={home}
            away={away}
            homeScore={frame.homeScore}
            awayScore={frame.awayScore}
          />
          <MomentumStrip
            points={frame.momentum}
            axisEnd={frame.momentumAxis}
            margin={frame.margin}
            home={home}
            away={away}
          />
        </div>

        <div className="order-5 lg:order-3 xl:order-3">
          <PlayByPlayFeed rows={frame.feed} home={home} away={away} />
        </div>

        <AnimatePresence>
          {status === "PERIOD_BREAK" && (
            <div className="bg-background/70 absolute inset-0 z-10 flex items-center justify-center px-4 backdrop-blur-[2px]">
              <PeriodBreakCard
                summary={periodSummary(game.events, cursor)}
                home={home}
                away={away}
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

      <ReplayControlBar
        speed={speed}
        mode={mode}
        canSkip={status !== "FINAL"}
        onSpeedChange={onSpeedChange}
        onModeChange={onModeChange}
        onSkip={skip}
      />
    </div>
  );
};

export default GameReplay;
