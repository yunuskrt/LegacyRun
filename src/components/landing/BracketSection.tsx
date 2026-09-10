"use client";

import React from "react";
import { motion, useReducedMotion } from "motion/react";
import { Trophy } from "lucide-react";
import LandingSection from "@/components/landing/LandingSection";
import DifficultyMeter from "@/components/tournament/DifficultyMeter";
import TeamCrest from "@/components/tournament/TeamCrest";
import { LADDER_ROUNDS } from "@/lib/landing";
import {
  BREATHE,
  FADE_RISE,
  sectionDelay,
  transitionFor,
} from "@/lib/motion";
import { cn } from "@/lib/utils";

type Props = {};

const MATCH_RULES = [
  "Every series is best-of-7, simulated possession by possession from real advanced stats — no dice roll on a final score.",
  "Watch it live at Slow, Normal or Fast, in Manual or Automatic. Pacing only, never the result.",
  "Stronger teams win more often. Upsets stay possible.",
];

const BracketSection = ({}: Props) => {
  const reduced = useReducedMotion() ?? false;

  return (
    <LandingSection
      id="tournament"
      eyebrow="The tournament"
      title="Four rounds. Real teams. Increasing difficulty."
    >
      {/* 2x2 before lg — four across leaves ~139px of content, which wraps the team names. */}
      <ol className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {LADDER_ROUNDS.map((round, index) => {
          const isFinals = index === LADDER_ROUNDS.length - 1;

          return (
            <motion.li
              key={round.round}
              className={cn(
                "relative flex flex-col rounded-xl border p-4",
                isFinals
                  ? "border-primary/60 bg-card shadow-trophy"
                  : "border-border/60 bg-card/50"
              )}
              data-motion-reveal
              initial={FADE_RISE.initial}
              whileInView={FADE_RISE.animate}
              viewport={{ once: true, amount: 0.4 }}
              transition={{
                ...transitionFor("slow", reduced),
                delay: sectionDelay(index, { reduced }),
              }}
            >
              {isFinals && (
                <motion.span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 rounded-xl shadow-[0_0_1.5rem_-0.5rem_var(--primary)]"
                  data-motion-reveal
                  initial={false}
                  // The page's one permitted loop; CSS pins it lit under reduced motion.
                  animate={{ opacity: BREATHE.opacity }}
                  transition={
                    reduced
                      ? transitionFor("quick", reduced)
                      : {
                          duration: BREATHE.duration,
                          ease: BREATHE.ease,
                          repeat: Infinity,
                          delay: sectionDelay(index),
                        }
                  }
                />
              )}

              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground text-[0.625rem] font-semibold tracking-[0.16em] uppercase">
                  {round.label}
                </span>
                {isFinals && (
                  <Trophy
                    className="text-primary size-4 shrink-0"
                    aria-hidden="true"
                  />
                )}
              </div>

              <div className="mt-4 flex items-center gap-3">
                <TeamCrest
                  code={round.teamSlug}
                  isSquad={isFinals}
                  size="sm"
                />
                <span className="min-w-0 text-sm leading-tight font-semibold">
                  {round.seasonYear} {round.teamName}
                </span>
              </div>

              <div className="text-muted-foreground mt-4 flex items-center gap-2 text-[0.6875rem]">
                <span className="bg-secondary/70 rounded px-1.5 py-0.5 font-semibold tracking-[0.1em] uppercase">
                  {round.seed} seed
                </span>
                <span className="tabular-nums">
                  {round.wins}—{round.losses}
                  <span className="sr-only"> playoff record</span>
                </span>
              </div>

              <div className="mt-3">
                <DifficultyMeter band={round.band} />
              </div>
            </motion.li>
          );
        })}
      </ol>

      <p className="text-muted-foreground mt-8 text-sm leading-relaxed">
        Opponents are drawn from 724 real playoff teams, seeded so every round is
        harder than the last. Pick East or West — both paths are balanced.
      </p>

      <ul className="mt-6 space-y-3">
        {MATCH_RULES.map((rule) => (
          <li
            key={rule}
            className="text-muted-foreground flex gap-3 text-sm leading-relaxed"
          >
            <span
              aria-hidden="true"
              className="bg-primary mt-2 size-1.5 shrink-0 rounded-full"
            />
            {rule}
          </li>
        ))}
      </ul>
    </LandingSection>
  );
};

export default BracketSection;
