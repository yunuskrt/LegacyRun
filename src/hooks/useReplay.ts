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
  jumpToEnd: () => void;
};

// A timeout chain, not an interval — the delay changes every tick. Rules live in `nextTick`.
export const useReplay = (game: GameResult, speed: ReplaySpeed): Replay => {
  const { events } = game;
  const [cursor, setCursor] = React.useState(PRE_TIP_CURSOR);
  const [paused, setPaused] = React.useState(false);
  const [seed, setSeed] = React.useState(game.seed);
  const boundaries = React.useMemo(() => periodBoundaries(events), [events]);

  // Reset during render, not in an effect, so no stale frame is ever painted.
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
      switch (tick.kind) {
        case "RESUME":
          setPaused(false);
          return;
        case "EVENT":
          setCursor(tick.cursor);
          if (tick.pauseAfter) setPaused(true);
          return;
      }
    }, tick.delayMs);

    return () => clearTimeout(timer);
  }, [cursor, paused, events, boundaries, speed]);

  const jumpToEnd = React.useCallback(() => {
    setPaused(false);
    setCursor(events.length - 1);
  }, [events.length]);

  const frame = React.useMemo(() => replayFrame(game, cursor), [game, cursor]);

  return { frame, cursor, status, jumpToEnd };
};
