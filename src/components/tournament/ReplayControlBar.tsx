import React from "react";
import type { ReplaySpeed } from "@/lib/replay";

type Props = {
  speed: ReplaySpeed;
};

const SPEEDS: ReplaySpeed[] = ["SLOW", "NORMAL", "FAST"];

// Phase 17 ships Normal speed, Manual mode, no skip. The bar renders disabled
// so the space it occupies is real at every width; Phase 18 wires it up.
const ReplayControlBar = ({ speed }: Props) => (
  <div
    className="border-border/70 bg-card/80 flex flex-wrap items-center justify-between gap-3 rounded-xl border px-3 py-3 opacity-60"
    aria-hidden="true"
  >
    <div className="bg-court flex items-center gap-1 rounded-lg p-1">
      {SPEEDS.map((entry) => (
        <span
          key={entry}
          className={`flex min-h-11 items-center rounded-md px-4 text-[0.6875rem] font-bold tracking-[0.14em] ${
            entry === speed
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground"
          }`}
        >
          {entry}
        </span>
      ))}
    </div>

    <div className="flex flex-wrap items-center gap-3">
      <div className="bg-court flex items-center gap-1 rounded-lg p-1">
        {["MANUAL", "AUTOMATIC"].map((mode) => (
          <span
            key={mode}
            className={`flex min-h-11 items-center rounded-md px-4 text-[0.6875rem] font-bold tracking-[0.14em] ${
              mode === "MANUAL"
                ? "bg-secondary text-foreground"
                : "text-muted-foreground"
            }`}
          >
            {mode}
          </span>
        ))}
      </div>

      <span className="text-muted-foreground flex min-h-11 items-center px-3 text-[0.6875rem] font-bold tracking-[0.14em]">
        SKIP TO FINAL
      </span>
    </div>
  </div>
);

export default ReplayControlBar;
