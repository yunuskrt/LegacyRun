import React from "react";
import { BAND_DOTS } from "@/lib/tournament-view";
import type { DifficultyBand } from "@/lib/tournament-view";

type Props = {
  band: DifficultyBand;
  dimmed?: boolean;
};

const DifficultyMeter = ({ band, dimmed = false }: Props) => {
  const filled = BAND_DOTS[band];

  return (
    <span
      className={`flex items-center gap-2 text-[0.6875rem] font-semibold tracking-[0.14em] ${
        dimmed ? "text-muted-foreground/60" : "text-muted-foreground"
      }`}
    >
      {band}
      <span className="flex items-center gap-1" aria-hidden="true">
        {[0, 1, 2].map((index) => (
          <span
            key={index}
            className={`h-1.5 w-2.5 rounded-full ${
              index < filled
                ? dimmed
                  ? "bg-primary/40"
                  : "bg-primary"
                : "bg-muted-foreground/25"
            }`}
          />
        ))}
      </span>
    </span>
  );
};

export default DifficultyMeter;
