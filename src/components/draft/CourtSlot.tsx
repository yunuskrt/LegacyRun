import React from "react";
import { Check } from "lucide-react";
import { abbreviatePlayerName, formatSeasonShort } from "@/lib/format";
import {
  POSITION_BORDER,
  POSITION_GLOW,
  POSITION_TEXT,
} from "@/lib/position-style";
import { cn } from "@/lib/utils";
import type { Position, SquadMember } from "@/types/game";

type Props = {
  position: Position;
  member?: SquadMember;
  isOpen: boolean;
};

const SLOT_SHELL =
  "flex min-h-[20cqw] w-full flex-col items-center justify-center rounded-[1.6cqw] p-[2cqw]";

const JERSEY =
  "block size-[9cqw] bg-current [mask-image:url(/assets/jersey-empty-slot.svg)] [mask-position:center] [mask-repeat:no-repeat] [mask-size:contain]";

const CourtSlot = ({ position, member, isOpen }: Props) => {
  if (member) {
    return (
      <div
        className={cn(
          SLOT_SHELL,
          "bg-card relative border-2",
          POSITION_BORDER[position],
          POSITION_GLOW[position]
        )}
      >
        <span className="bg-primary text-primary-foreground absolute top-[1.4cqw] right-[1.4cqw] flex size-[2.6cqw] items-center justify-center rounded-full">
          <Check className="size-[1.8cqw]" strokeWidth={3.5} />
        </span>
        <span className="text-muted-foreground block size-[9cqw] bg-current [mask-image:url(/assets/player-silhouette.svg)] [mask-position:center] [mask-repeat:no-repeat] [mask-size:contain]" />
        <p className="mt-[1.4cqw] text-center text-[clamp(0.6rem,1.85cqw,0.95rem)] leading-tight font-semibold">
          {abbreviatePlayerName(member.name)}
        </p>
        <p className="mt-[0.8cqw] flex items-center gap-[1cqw] text-[clamp(0.5rem,1.45cqw,0.8rem)] leading-none">
          <span className={cn("font-bold", POSITION_TEXT[position])}>
            {position} {formatSeasonShort(member.seasonYear)}
          </span>
          <span className="bg-primary text-primary-foreground rounded-[0.5cqw] px-[0.9cqw] py-[0.5cqw] font-bold">
            {member.rating}
          </span>
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        SLOT_SHELL,
        "border-2 border-dashed",
        isOpen
          ? "border-primary bg-primary/12 shadow-[0_0_0.9rem_-0.7rem_var(--primary)]"
          : "border-muted-foreground/25 bg-foreground/[0.02]"
      )}
    >
      <span
        className={cn(
          JERSEY,
          isOpen ? "text-primary" : "text-muted-foreground/45"
        )}
      />
      <p
        className={cn(
          "mt-[1.4cqw] text-[clamp(0.7rem,2cqw,1.15rem)] leading-none font-bold tracking-[0.12em]",
          isOpen ? "text-foreground" : POSITION_TEXT[position]
        )}
      >
        {position}
      </p>
      <p className="text-muted-foreground mt-[0.8cqw] text-[clamp(0.5rem,1.45cqw,0.8rem)] leading-none tracking-[0.16em]">
        {isOpen ? "OPEN" : "EMPTY"}
      </p>
    </div>
  );
};

export default CourtSlot;
