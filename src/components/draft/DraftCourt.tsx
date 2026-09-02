"use client";

import React from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import CourtSlot from "@/components/draft/CourtSlot";
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

// Percentages of the court box, which is locked to the court SVG's 100x110
// viewBox — that is what keeps the slots aligned at every breakpoint.
const SLOT_PLACEMENT: Record<Position, string> = {
  PG: "left-[50%] top-[78%]",
  SG: "left-[15%] top-[60%]",
  SF: "left-[85%] top-[58%]",
  PF: "left-[27%] top-[27%]",
  C: "left-[62%] top-[15%]",
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
    <div className="bg-court shadow-panel @container border-border relative aspect-[100/110] w-full rounded-2xl border bg-no-repeat [background-image:url(/assets/court.svg)] [background-size:100%_100%]">
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
              "absolute w-[30%] -translate-x-1/2 -translate-y-1/2",
              SLOT_PLACEMENT[position]
            )}
            // Every slot accepts the drop so a mistaken one can be reported
            // instead of silently doing nothing.
            onDragOver={(event) => event.preventDefault()}
            onDragEnter={() => setDragOver(position)}
            // `dragleave` also fires when the pointer crosses into a child, and
            // that one carries the same position — so the target check is not
            // enough on its own and the state flickers off as fast as it is set.
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
                // Only the five empty slots arrive together, and they only do
                // so on mount — a drafted card lands alone, so staggering it
                // would just be lag (C waiting 0.24s where PG is instant).
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
