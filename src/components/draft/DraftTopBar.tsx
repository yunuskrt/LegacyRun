import React from "react";
import { Trophy } from "lucide-react";

type Props = {
  filledSlots: number;
  totalSlots: number;
};

const DraftTopBar = ({ filledSlots, totalSlots }: Props) => {
  return (
    <header className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <span className="bg-gold shadow-trophy flex size-12 shrink-0 items-center justify-center rounded-2xl sm:size-14">
          <Trophy
            className="text-primary-foreground size-6 sm:size-7"
            strokeWidth={2.25}
          />
        </span>
        <div className="min-w-0">
          <p className="text-xl leading-tight font-bold tracking-[0.18em] sm:text-2xl">
            LEGACYRUN
          </p>
          <p className="text-muted-foreground text-sm sm:text-base">
            Draft Room · 1980–2026
          </p>
        </div>
      </div>

      <div className="shrink-0 text-right">
        <p className="text-muted-foreground text-xs tracking-[0.16em] uppercase sm:text-sm">
          Slots Filled
        </p>
        <p className="text-primary text-xl font-bold sm:text-2xl">
          {filledSlots}/{totalSlots}
        </p>
      </div>
    </header>
  );
};

export default DraftTopBar;
