"use client";

import React from "react";
import { REPLAY_MODES, REPLAY_SPEEDS } from "@/lib/series-flow";
import type { ReplayMode } from "@/lib/series-flow";
import type { ReplaySpeed } from "@/lib/replay";

type Props = {
  speed: ReplaySpeed;
  mode: ReplayMode;
  canSkip: boolean;
  onSpeedChange: (speed: ReplaySpeed) => void;
  onModeChange: (mode: ReplayMode) => void;
  onSkip: () => void;
};

// 44px minimum on every control — the bar is pinned to the bottom on mobile,
// where these are the only touch targets on screen.
const SEGMENT =
  "flex min-h-11 items-center rounded-md px-4 text-[0.6875rem] font-bold tracking-[0.14em]";

const ReplayControlBar = ({
  speed,
  mode,
  canSkip,
  onSpeedChange,
  onModeChange,
  onSkip,
}: Props) => (
  <div className="border-border/70 bg-card/95 fixed inset-x-0 bottom-0 z-30 flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 backdrop-blur md:static md:rounded-xl md:border md:px-3">
    <div
      className="bg-court flex items-center gap-1 rounded-lg p-1"
      role="group"
      aria-label="Replay speed"
    >
      {REPLAY_SPEEDS.map((entry) => (
        <button
          key={entry}
          type="button"
          aria-pressed={entry === speed}
          onClick={() => onSpeedChange(entry)}
          className={`${SEGMENT} ${
            entry === speed
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {entry}
        </button>
      ))}
    </div>

    <div className="flex flex-wrap items-center gap-3">
      <div
        className="bg-court flex items-center gap-1 rounded-lg p-1"
        role="group"
        aria-label="Advance mode"
      >
        {REPLAY_MODES.map((entry) => (
          <button
            key={entry}
            type="button"
            aria-pressed={entry === mode}
            onClick={() => onModeChange(entry)}
            className={`${SEGMENT} ${
              entry === mode
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {entry}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={onSkip}
        disabled={!canSkip}
        className="text-muted-foreground hover:text-foreground flex min-h-11 items-center px-3 text-[0.6875rem] font-bold tracking-[0.14em] disabled:opacity-40 disabled:hover:text-current"
      >
        SKIP TO FINAL
      </button>
    </div>
  </div>
);

export default ReplayControlBar;
