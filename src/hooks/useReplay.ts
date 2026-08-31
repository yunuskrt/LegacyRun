"use client";

import React from "react";
import {
  PRE_TIP_CURSOR,
  nextTick,
  periodBoundaries,
  replayFrame,
  replayStatus,
} from "@/lib/replay";
import type { ReplayFrame, ReplaySpeed, ReplayStatus } from "@/lib/replay";
import type { GameResult } from "@/types/match";

export type { ReplayStatus };

export type Replay = {
  frame: ReplayFrame;
  cursor: number;
  status: ReplayStatus;
  advance: () => void;
  jumpToEnd: () => void;
};

// A timeout chain rather than an interval: the delay between two events is a
// function of the game clock between them, so it changes every tick. Every
// decision about what comes next lives in `nextTick`; this is only the timer.
export const useReplay = (game: GameResult, speed: ReplaySpeed): Replay => {
  const { events } = game;
  const [cursor, setCursor] = React.useState(PRE_TIP_CURSOR);
  const [paused, setPaused] = React.useState(false);
  const [seed, setSeed] = React.useState(game.seed);
  const boundaries = React.useMemo(() => periodBoundaries(events), [events]);

  // Resetting during render rather than in an effect — the replay restarts on
  // the render that first sees a new game, with no discarded frame in between.
  if (seed !== game.seed) {
    setSeed(game.seed);
    setCursor(PRE_TIP_CURSOR);
    setPaused(false);
  }

  const status = replayStatus(cursor, events.length, paused);

  React.useEffect(() => {
    const tick = nextTick(events, boundaries, cursor, paused, speed);

    if (!tick) return;

    const timer = setTimeout(() => {
      if (tick.kind === "RESUME") {
        setPaused(false);
        return;
      }

      setCursor(tick.cursor);
      if (tick.pauseAfter) setPaused(true);
    }, tick.delayMs);

    return () => clearTimeout(timer);
  }, [cursor, paused, events, boundaries, speed]);

  const advance = React.useCallback(() => {
    setPaused(false);
    setCursor((current) => Math.min(current + 1, events.length - 1));
  }, [events.length]);

  // No caller until Phase 18's "Skip to final".
  const jumpToEnd = React.useCallback(() => {
    setPaused(false);
    setCursor(events.length - 1);
  }, [events.length]);

  const frame = React.useMemo(() => replayFrame(game, cursor), [game, cursor]);

  return { frame, cursor, status, advance, jumpToEnd };
};
