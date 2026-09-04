"use client";

import React from "react";
import { advanceDelayMs } from "@/lib/series-flow";
import type { StageAdvance } from "@/lib/series-flow";

// Fires `onAdvance` once, after the stage's own delay. `CLICK` and `NONE`
// schedule nothing, so switching to Manual mid-hold cancels the timer and
// switching to Automatic starts one — that is what makes the modes switchable
// at any time without any state of their own.
//
// The callback is held in a ref so only the delay drives the timer: an
// unmemoized `onAdvance` would otherwise restart the hold on every render of
// the parent, and the beat would never elapse.
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
