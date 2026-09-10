"use client";

import React from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import CourtSlot from "@/components/draft/CourtSlot";
import {
  COURT_SHELL,
  COURT_SLOT_PLACEMENT,
  COURT_SLOT_WIDTH,
} from "@/lib/court-layout";
import { PLAYER_DRAG_TYPE } from "@/lib/draft";
import { slotMotionState } from "@/lib/draft-preview";
import { staggeredTransition } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { DraftablePlayer, Position, SquadMember } from "@/types/game";

type Props = {
  slots: readonly Position[];
  members: SquadMember[];
  hasActiveTeam: boolean;
  selectedPosition: Position | null;
  previewPlayer: DraftablePlayer | null;
  acceptsPlayer: (player: DraftablePlayer, position: Position) => boolean;
  onSelectSlot: (position: Position) => void;
  onDropPlayer: (playerSeasonId: string, position: Position) => void;
};

const DraftCourt = ({
  slots,
  members,
  hasActiveTeam,
  selectedPosition,
  previewPlayer,
  acceptsPlayer,
  onSelectSlot,
  onDropPlayer,
}: Props) => {
  const reduced = useReducedMotion() ?? false;
  const [dragOver, setDragOver] = React.useState<Position | null>(null);

  return (
    // Capped on width, never height — a height cap stretches the court and spreads the slots.
    <div
      className={cn(
        COURT_SHELL,
        "shadow-panel border-border mx-auto border lg:max-w-[calc((100svh_-_12rem)/1.1)]"
      )}
    >
      {slots.map((position, index) => {
        const member = members.find((entry) => entry.position === position);
        const isOpen = hasActiveTeam && !member;
        const isSelected = selectedPosition === position && !member;
        const { isInviting, dragState } = slotMotionState({
          position,
          isFilled: Boolean(member),
          isOpen,
          isSelected,
          previewPlayer,
          dragOver,
          accepts: acceptsPlayer,
        });

        return (
          <div
            key={position}
            className={cn(
              "absolute -translate-x-1/2 -translate-y-1/2",
              COURT_SLOT_WIDTH,
              COURT_SLOT_PLACEMENT[position]
            )}
            // Every slot accepts the drop so a mistaken one is reported, not ignored.
            onDragOver={(event) => event.preventDefault()}
            onDragEnter={() => setDragOver(position)}
            // `dragleave` also fires crossing into a child, so the target check alone flickers.
            onDragLeave={(event) => {
              if (event.currentTarget.contains(event.relatedTarget as Node))
                return;
              setDragOver((current) => (current === position ? null : current));
            }}
            onDrop={(event) => {
              event.preventDefault();
              setDragOver(null);
              const playerSeasonId =
                event.dataTransfer.getData(PLAYER_DRAG_TYPE);
              if (playerSeasonId) onDropPlayer(playerSeasonId, position);
            }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={member ? member.playerSeasonId : "open"}
                initial={{ opacity: 0, scale: 0.82, y: -12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                // Empty slots only ever arrive together; a drafted card lands alone.
                transition={staggeredTransition("spring", member ? 0 : index, {
                  step: 0.06,
                  reduced,
                })}
              >
                <CourtSlot
                  position={position}
                  member={member}
                  isOpen={isOpen}
                  isSelected={isSelected}
                  isInviting={isInviting}
                  dragState={dragState}
                  onSelect={() => onSelectSlot(position)}
                />
              </motion.div>
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
};

export default DraftCourt;
