"use client";

import React from "react";
import { motion, useReducedMotion } from "motion/react";
import LandingSection from "@/components/landing/LandingSection";
import PositionChip from "@/components/tournament/PositionChip";
import { DUPLICATE_EXAMPLE } from "@/lib/landing";
import {
  DOT_ENTRANCE,
  FADE_RISE,
  sectionDelay,
  staggeredTransition,
  transitionFor,
} from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { Position } from "@/types/game";

type Props = {};

const SLOTS: Position[] = ["PG", "SG", "SF", "PF", "C"];

const TOTAL_REROLLS = 5;

// One dot goes out, once, as a demonstration — after the card itself has arrived.
const SPEND_DELAY = 0.9;

const RULES = [
  {
    title: "Five slots, five positions.",
    body: "PG · SG · SF · PF · C. You cannot draft five point guards.",
  },
  {
    title: "Five rerolls. That's all.",
    body: "Don't like the roster you're shown? Spend one. There are only five.",
  },
  {
    title: "One player, once.",
    body: `${DUPLICATE_EXAMPLE.taken.seasonYear} LeBron and ${DUPLICATE_EXAMPLE.blocked.seasonYear} LeBron are the same man. Pick him once, he's gone.`,
  },
];

const DraftSection = ({}: Props) => {
  const reduced = useReducedMotion() ?? false;

  const card = (index: number) => ({
    "data-motion-reveal": true,
    initial: FADE_RISE.initial,
    whileInView: FADE_RISE.animate,
    viewport: { once: true, amount: 0.4 } as const,
    transition: {
      ...transitionFor("slow", reduced),
      delay: sectionDelay(index, { reduced }),
    },
  });

  return (
    <LandingSection
      id="draft"
      eyebrow="The draft"
      title="You will not get the five you want."
    >
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {RULES.map((rule, index) => (
          <motion.div
            key={rule.title}
            {...card(index)}
            className="border-border/60 bg-card/50 flex flex-col rounded-xl border p-5"
          >
            <h3 className="text-base font-semibold">{rule.title}</h3>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
              {rule.body}
            </p>

            <div className="mt-5 flex flex-1 items-end">
              {index === 0 && (
                <div className="flex gap-2">
                  {SLOTS.map((position, slotIndex) => (
                    <motion.span
                      key={position}
                      data-motion-reveal
                      initial={DOT_ENTRANCE}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true, amount: 0.4 }}
                      transition={staggeredTransition("quick", slotIndex, {
                        step: 0.05,
                        reduced,
                      })}
                    >
                      <PositionChip position={position} />
                    </motion.span>
                  ))}
                </div>
              )}

              {index === 1 && (
                <div
                  className="flex items-center gap-2"
                  aria-label={`${TOTAL_REROLLS - 1} of ${TOTAL_REROLLS} rerolls left`}
                >
                  {Array.from({ length: TOTAL_REROLLS }, (_, dot) => (
                    <span
                      key={dot}
                      aria-hidden="true"
                      className="bg-muted-foreground/25 relative block size-2.5 rounded-full"
                    >
                      <motion.span
                        className="bg-primary absolute inset-0 rounded-full"
                        // The spent dot's rest state is out, not lit.
                        data-motion-spent={dot === TOTAL_REROLLS - 1 || undefined}
                        data-motion-reveal={dot < TOTAL_REROLLS - 1 || undefined}
                        initial={false}
                        // Only the last dot is spent; the rest stay lit.
                        whileInView={
                          dot === TOTAL_REROLLS - 1
                            ? { opacity: 0, scale: 0.6 }
                            : { opacity: 1, scale: 1 }
                        }
                        viewport={{ once: true, amount: 0.4 }}
                        transition={{
                          ...transitionFor("base", reduced),
                          delay: reduced ? 0 : SPEND_DELAY,
                        }}
                      />
                    </span>
                  ))}
                </div>
              )}

              {index === 2 && (
                <div className="w-full space-y-2">
                  {[
                    { entry: DUPLICATE_EXAMPLE.taken, isBlocked: false },
                    { entry: DUPLICATE_EXAMPLE.blocked, isBlocked: true },
                  ].map(({ entry, isBlocked }) => (
                    <div
                      key={entry.seasonYear}
                      className={cn(
                        "border-border/60 bg-secondary/40 flex items-center justify-between gap-3 rounded-lg border px-3 py-2",
                        isBlocked && "opacity-40"
                      )}
                    >
                      <span className="min-w-0">
                        <span
                          className={cn(
                            "block truncate text-xs font-semibold",
                            isBlocked && "line-through"
                          )}
                        >
                          {DUPLICATE_EXAMPLE.name}
                        </span>
                        <span className="text-muted-foreground block truncate text-[0.6875rem]">
                          {entry.seasonYear} {DUPLICATE_EXAMPLE.teamName}
                        </span>
                      </span>
                      <span className="text-primary shrink-0 text-xs font-bold tabular-nums">
                        {entry.rating}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      <p className="mt-10 text-center text-lg font-semibold text-balance sm:text-xl">
        The best five players available is never the best five you can pick.
      </p>
    </LandingSection>
  );
};

export default DraftSection;
