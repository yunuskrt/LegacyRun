"use client";

import React from "react";
import { advanceDelayMs } from "@/lib/series-flow";
import type { StageAdvance } from "@/lib/series-flow";

// The callback is held in a ref so only the delay drives the timer, never a re-render.
export const useAutoAdvance = (
  stageAdvance: StageAdvance,
  onAdvance: () => void
): void => {
  const delayMs = advanceDelayMs(stageAdvance);
  const callback = React.useRef(onAdvance);

  React.useEffect(() => {
    callback.current = onAdvance;
  }, [onAdvance]);

  React.useEffect(() => {
    if (delayMs === null) return;

    const timer = setTimeout(() => callback.current(), delayMs);

    return () => clearTimeout(timer);
  }, [delayMs]);
};
