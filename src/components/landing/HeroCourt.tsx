"use client";

import React from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  COURT_SHELL,
  COURT_SLOT_PLACEMENT,
  COURT_SLOT_WIDTH,
} from "@/lib/court-layout";
import { HERO_SLOTS } from "@/lib/landing";
import { sequencedTransition } from "@/lib/motion";
import {
  POSITION_BORDER,
  POSITION_SOFT_BG,
  POSITION_TEXT,
} from "@/lib/position-style";
import { cn } from "@/lib/utils";

type Props = {
  section: number;
};

// The step DraftCourt uses for court slots; STAGGER_STEP's list rhythm reads as simultaneous here.
const SLOT_STEP = 0.06;

const JERSEY =
  "block size-[8cqw] bg-current [mask-image:url(/assets/jersey-empty-slot.svg)] [mask-position:center] [mask-repeat:no-repeat] [mask-size:contain]";

const HeroCourt = ({ section }: Props) => {
  const reduced = useReducedMotion() ?? false;

  return (
    <div
      className={cn(
        COURT_SHELL,
        "shadow-panel border-border/70 mx-auto border sm:max-w-[26rem] lg:max-w-none"
      )}
    >
      <ul className="contents">
        {HERO_SLOTS.map((slot, index) => (
          <li
            key={slot.position}
            className={cn(
              "absolute -translate-x-1/2 -translate-y-1/2",
              COURT_SLOT_WIDTH,
              COURT_SLOT_PLACEMENT[slot.position]
            )}
          >
            <span
              aria-hidden="true"
              className="border-primary/45 absolute inset-0 flex flex-col items-center justify-center gap-[1cqw] rounded-[1.6cqw] border-2 border-dashed"
            >
              <span className={cn(JERSEY, "text-primary/70")} />
              <span
                className={cn(
                  "text-[clamp(0.6rem,2.4cqw,1.05rem)] leading-none font-bold tracking-[0.12em]",
                  POSITION_TEXT[slot.position]
                )}
              >
                {slot.position}
              </span>
            </span>

            <motion.div
              className={cn(
                "bg-card relative rounded-[1.6cqw] border-2 p-[2.2cqw]",
                POSITION_BORDER[slot.position]
              )}
              data-motion-reveal
              // Never from scale(0) — a card that was never a shape reads as a pop.
              initial={{ opacity: 0, scale: 0.92, y: "-6%" }}
              animate={{ opacity: 1, scale: 1, y: "0%" }}
              transition={sequencedTransition("spring", section, index, {
                step: SLOT_STEP,
                reduced,
              })}
            >
              <div className="flex items-center justify-between gap-[1cqw]">
                <span className="flex items-center gap-[1.2cqw]">
                  <span
                    className={cn(
                      "flex items-center justify-center rounded-full px-[1.5cqw] py-[0.8cqw] text-[clamp(0.5rem,1.85cqw,0.8rem)] leading-none font-bold",
                      POSITION_SOFT_BG[slot.position],
                      POSITION_TEXT[slot.position]
                    )}
                  >
                    {slot.teamSlug}
                  </span>
                  <span
                    className={cn(
                      "text-[clamp(0.5rem,1.95cqw,0.85rem)] leading-none font-bold tracking-[0.1em]",
                      POSITION_TEXT[slot.position]
                    )}
                  >
                    {slot.position}
                  </span>
                </span>
                <span className="bg-primary text-primary-foreground flex items-center justify-center rounded-full px-[1.5cqw] py-[0.8cqw] text-[clamp(0.5rem,1.85cqw,0.8rem)] leading-none font-bold">
                  {slot.rating}
                  <span className="sr-only"> overall</span>
                </span>
              </div>

              <p className="mt-[1.8cqw] truncate text-[clamp(0.6rem,2.5cqw,1.05rem)] leading-tight font-semibold">
                {slot.name}
              </p>
              <p className="text-muted-foreground mt-[0.7cqw] truncate text-[clamp(0.5rem,2.05cqw,0.85rem)] leading-tight">
                {slot.seasonYear} {slot.teamName}
              </p>
            </motion.div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default HeroCourt;
