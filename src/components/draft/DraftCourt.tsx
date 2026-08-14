"use client";

import React from "react";
import { AnimatePresence, motion } from "motion/react";
import CourtSlot from "@/components/draft/CourtSlot";
import { cn } from "@/lib/utils";
import type { Position, SquadMember } from "@/types/game";

type Props = {
  slots: readonly Position[];
  members: SquadMember[];
  hasActiveTeam: boolean;
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

const DraftCourt = ({ slots, members, hasActiveTeam }: Props) => {
  return (
    <div className="bg-court shadow-panel @container border-border relative aspect-[100/110] w-full rounded-2xl border bg-no-repeat [background-image:url(/assets/court.svg)] [background-size:100%_100%]">
      {slots.map((position, index) => {
        const member = members.find((entry) => entry.position === position);

        return (
          <div
            key={position}
            className={cn(
              "absolute w-[30%] -translate-x-1/2 -translate-y-1/2",
              SLOT_PLACEMENT[position]
            )}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={member ? member.playerSeasonId : "open"}
                initial={{ opacity: 0, scale: 0.82, y: -12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{
                  type: "spring",
                  stiffness: 340,
                  damping: 26,
                  delay: index * 0.06,
                }}
              >
                <CourtSlot
                  position={position}
                  member={member}
                  isOpen={hasActiveTeam && !member}
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
