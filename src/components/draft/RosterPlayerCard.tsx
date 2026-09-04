"use client";

import React from "react";
import { motion, useReducedMotion } from "motion/react";
import { Ban } from "lucide-react";
import RatingBadge from "@/components/draft/RatingBadge";
import { PLAYER_DRAG_TYPE, type PlayerAvailability } from "@/lib/draft";
import { abbreviatePlayerName } from "@/lib/format";
import { transitionFor } from "@/lib/motion";
import { POSITION_BG, POSITION_TEXT } from "@/lib/position-style";
import { cn } from "@/lib/utils";
import type { DraftablePlayer, Position } from "@/types/game";

type Props = {
  player: DraftablePlayer;
  availability: PlayerAvailability;
  selectedPosition: Position | null;
  onDraft: () => void;
  onDragChange: (dragging: boolean) => void;
};

const blockedReason = (
  availability: PlayerAvailability,
  selectedPosition: Position | null
): string | null => {
  if (availability === "ALREADY_DRAFTED") return "Already drafted";
  if (availability === "OUT_OF_POSITION") return "Slot filled";
  if (availability === "OFF_SLOT" && selectedPosition)
    return `Not a ${selectedPosition}`;
  return null;
};

const RosterPlayerCard = ({
  player,
  availability,
  selectedPosition,
  onDraft,
  onDragChange,
}: Props) => {
  const reduced = useReducedMotion() ?? false;
  const isDraftable = availability === "DRAFTABLE";
  const isDisabled =
    availability !== "DRAFTABLE" && availability !== "AVAILABLE";
  const reason = blockedReason(availability, selectedPosition);

  return (
    // The gesture sits on a wrapper because `motion.button` reserves
    // `onDragStart`/`onDragEnd` for its own drag gesture, which would shadow the
    // native HTML5 handlers the drag payload depends on.
    <motion.div
      // Transform and shadow only — a layout property here would reflow a
      // 23-card grid on every pointer move. Reduced motion drops the gesture
      // outright; motion would otherwise snap to the lifted value instead of
      // animating to it, which still moves the card.
      whileHover={isDisabled || reduced ? undefined : { y: -2 }}
      whileTap={isDisabled || reduced ? undefined : { scale: 0.98 }}
      transition={transitionFor("quick", reduced)}
      // Flex so the button fills the wrapper: the wrapper is the grid item
      // now, and without this a card with no blocked-reason line comes out
      // shorter than the one beside it.
      className={cn(
        "flex h-full rounded-xl",
        !isDisabled && "hover:shadow-[0_6px_18px_-10px_var(--primary)]"
      )}
    >
      <button
        type="button"
        disabled={isDisabled}
        onClick={onDraft}
        draggable={isDraftable}
        onDragStart={(event) => {
          event.dataTransfer.setData(PLAYER_DRAG_TYPE, player.playerSeasonId);
          event.dataTransfer.effectAllowed = "move";
          onDragChange(true);
        }}
        // `dragend` fires even on a cancelled drag, so it is the reliable clear.
        onDragEnd={() => onDragChange(false)}
        className={cn(
          "border-border/70 bg-secondary/45 focus-visible:ring-ring/60 relative w-full overflow-hidden rounded-xl border py-4 pr-4 pl-5 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none",
          isDisabled
            ? "cursor-not-allowed opacity-60"
            : "hover:border-primary/50 hover:bg-secondary/80 cursor-pointer",
          isDraftable &&
            "border-primary/60 bg-secondary/70 active:cursor-grabbing"
        )}
      >
        {!isDisabled && (
          <span
            className={cn(
              "absolute inset-y-0 left-0 w-1",
              POSITION_BG[player.position]
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
            <span
              className={cn(
                POSITION_TEXT[player.position],
                isDisabled && "opacity-60"
              )}
            >
              {player.position}
            </span>
          </span>
          <RatingBadge rating={player.rating} dimmed={isDisabled} />
        </div>

        {reason && (
          <p className="text-muted-foreground mt-2 flex items-center gap-1.5 text-xs tracking-[0.12em] uppercase">
            <Ban className="size-3.5" />
            {reason}
          </p>
        )}
      </button>
    </motion.div>
  );
};

export default RosterPlayerCard;
