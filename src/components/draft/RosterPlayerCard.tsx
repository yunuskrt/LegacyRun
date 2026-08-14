import React from "react";
import { Ban } from "lucide-react";
import { abbreviatePlayerName } from "@/lib/format";
import { POSITION_BG, POSITION_TEXT } from "@/lib/position-style";
import { cn } from "@/lib/utils";
import type { DraftablePlayer } from "@/types/game";

type Props = {
  player: DraftablePlayer;
  isDisabled: boolean;
};

const RosterPlayerCard = ({ player, isDisabled }: Props) => {
  return (
    <button
      type="button"
      disabled={isDisabled}
      className={cn(
        "border-border/70 bg-secondary/45 focus-visible:ring-ring/60 relative w-full overflow-hidden rounded-xl border py-4 pr-4 pl-5 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none",
        isDisabled
          ? "cursor-not-allowed opacity-60"
          : "hover:border-primary/50 hover:bg-secondary/80 cursor-pointer"
      )}
    >
      {!isDisabled && (
        <span
          className={cn(
            "absolute inset-y-0 left-0 w-1",
            POSITION_BG[player.positions[0]]
          )}
        />
      )}

      <p
        className={cn(
          "truncate text-lg font-semibold",
          isDisabled && "text-muted-foreground"
        )}
      >
        {abbreviatePlayerName(player.name)}
      </p>

      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-sm font-bold">
          {player.positions.map((position) => (
            <span
              key={position}
              className={cn(
                POSITION_TEXT[position],
                isDisabled && "opacity-60"
              )}
            >
              {position}
            </span>
          ))}
        </span>
        <span
          className={cn(
            "rounded-md px-2 py-0.5 text-sm font-bold",
            isDisabled
              ? "bg-primary/25 text-primary-foreground/70"
              : "bg-primary text-primary-foreground"
          )}
        >
          {player.rating}
        </span>
      </div>

      {isDisabled && (
        <p className="text-muted-foreground mt-2 flex items-center gap-1.5 text-xs tracking-[0.12em] uppercase">
          <Ban className="size-3.5" />
          Slot filled
        </p>
      )}
    </button>
  );
};

export default RosterPlayerCard;
