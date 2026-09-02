"use client";

import React from "react";
import { motion, useReducedMotion } from "motion/react";
import { Check } from "lucide-react";
import { isSlotBreathing, type SlotDragState } from "@/lib/draft-preview";
import { abbreviatePlayerName, formatSeasonShort } from "@/lib/format";
import { BREATHE, DENY_SHAKE, transitionFor } from "@/lib/motion";
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
  isSelected: boolean;
  isInviting: boolean;
  dragState: SlotDragState;
  onSelect: () => void;
};

const SLOT_SHELL =
  "flex min-h-[20cqw] w-full flex-col items-center justify-center rounded-[1.6cqw] p-[2cqw]";

const JERSEY =
  "block size-[9cqw] bg-current [mask-image:url(/assets/jersey-empty-slot.svg)] [mask-position:center] [mask-repeat:no-repeat] [mask-size:contain]";

const CourtSlot = ({
  position,
  member,
  isOpen,
  isSelected,
  isInviting,
  dragState,
  onSelect,
}: Props) => {
  const reduced = useReducedMotion() ?? false;

  // Transforms are percentages of the slot itself, never px — the court is a
  // container-sized box, so a px lift would drift at 390 (Phase 5). Reduced
  // motion drops the two transient drag responses but keeps the selection
  // settle, which marks a state rather than reacting to the pointer; motion
  // would otherwise snap them into place rather than omit them.
  const gesture = {
    scale: isSelected ? 1.02 : 1,
    y: !reduced && dragState === "VALID" ? "-4%" : "0%",
    x: !reduced && dragState === "INVALID" ? DENY_SHAKE.x : "0%",
  };

  const gestureTransition = {
    scale: transitionFor("spring", reduced),
    y: transitionFor("spring", reduced),
    x: { duration: reduced ? 0 : DENY_SHAKE.duration },
  };

  // Every gold glow on an empty slot comes from this one overlay; whether it
  // breathes or is held steady is decided in `draft-preview`.
  const isHeld = !isSlotBreathing({
    isInviting,
    isSelected,
    dragState,
    reduced,
  });

  const glow = (isInviting || isSelected) && (
    <motion.span
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 rounded-[1.6cqw]",
        dragState === "VALID"
          ? "shadow-[0_0_1.4rem_-0.5rem_var(--primary)]"
          : isSelected
            ? "shadow-[0_0_1.1rem_-0.55rem_var(--primary)]"
            : "shadow-[0_0_0.9rem_-0.7rem_var(--primary)]"
      )}
      initial={false}
      animate={{ opacity: isHeld ? 1 : BREATHE.opacity }}
      transition={
        isHeld
          ? transitionFor("quick", reduced)
          : {
              duration: BREATHE.duration,
              ease: BREATHE.ease,
              repeat: Infinity,
            }
      }
    />
  );

  if (member) {
    return (
      <motion.div
        animate={gesture}
        transition={gestureTransition}
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
      </motion.div>
    );
  }

  return (
    <motion.button
      type="button"
      disabled={!isOpen}
      onClick={onSelect}
      animate={gesture}
      transition={gestureTransition}
      className={cn(
        SLOT_SHELL,
        "focus-visible:ring-ring/60 relative border-2 border-dashed transition-colors focus-visible:ring-2 focus-visible:outline-none",
        isSelected
          ? "border-primary bg-primary/25 cursor-pointer border-solid"
          : dragState === "VALID"
            ? "border-primary bg-primary/25 cursor-pointer"
            : dragState === "INVALID"
              ? "border-muted-foreground/35 bg-foreground/[0.02]"
              : isOpen
                ? "border-primary bg-primary/12 hover:bg-primary/20 cursor-pointer"
                : "border-muted-foreground/25 bg-foreground/[0.02] cursor-not-allowed"
      )}
    >
      {glow}
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
      <p
        className={cn(
          "mt-[0.8cqw] text-[clamp(0.5rem,1.45cqw,0.8rem)] leading-none tracking-[0.16em]",
          isSelected ? "text-primary font-bold" : "text-muted-foreground"
        )}
      >
        {isSelected ? "SELECTED" : isOpen ? "OPEN" : "EMPTY"}
      </p>
    </motion.button>
  );
};

export default CourtSlot;
