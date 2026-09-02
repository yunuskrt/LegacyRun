"use client";

import React from "react";
import { motion } from "motion/react";
import { transitionFor } from "@/lib/motion";
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
// where these are the only touch targets on screen. The indicator sits behind
// the label and must not eat into that.
const SEGMENT =
  "relative flex min-h-11 items-center rounded-md px-4 text-[0.6875rem] font-bold tracking-[0.14em]";

// Two groups, two ids — a shared one would make the pill jump between the speed
// row and the mode row.
const SPEED_INDICATOR = "replay-speed-indicator";
const MODE_INDICATOR = "replay-mode-indicator";

const Indicator = ({
  layoutId,
  className,
}: {
  layoutId: string;
  className: string;
}) => (
  <motion.span
    layoutId={layoutId}
    transition={transitionFor("base")}
    className={`absolute inset-0 rounded-md ${className}`}
    aria-hidden="true"
  />
);

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
              ? "text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {entry === speed && (
            <Indicator layoutId={SPEED_INDICATOR} className="bg-primary" />
          )}
          <span className="relative">{entry}</span>
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
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {entry === mode && (
              <Indicator layoutId={MODE_INDICATOR} className="bg-secondary" />
            )}
            <span className="relative">{entry}</span>
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
