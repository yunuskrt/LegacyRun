"use client";

import React from "react";
import { motion, useReducedMotion } from "motion/react";
import TeamLogoBadge from "@/components/draft/TeamLogoBadge";
import DifficultyMeter from "@/components/tournament/DifficultyMeter";
import { squadRatingOf } from "@/lib/run";
import { FADE_RISE, entranceFrom, transitionFor } from "@/lib/motion";
import {
  SQUAD_SHORT_CODE,
  difficultyBand,
  hasSquadName,
  squadDisplayName,
} from "@/lib/tournament-view";
import type { BracketSlot } from "@/types/bracket";
import type { Squad } from "@/types/game";

type Props = {
  slot: BracketSlot;
  squad: Squad;
  scoreLabel: string | null;
  eliminated: boolean;
  compact?: boolean;
  resolving?: boolean;
};

// The strike itself is not animated — a rule that genuinely grows needs a
// pseudo-element or an overlay, which is more machinery than it earns. The
// colour crossfades and the strike appears with it. CSS, so the global
// reduced-motion block already flattens it.
const NAME_TRANSITION = "transition-colors duration-[var(--duration-base)]";

const TeamSlotRow = ({
  slot,
  squad,
  scoreLabel,
  eliminated,
  compact = false,
  resolving = false,
}: Props) => {
  const reduced = useReducedMotion() ?? false;

  // The bracket remounts between stages, so this plays only when the round it
  // belongs to is the one whose result just became visible.
  const score = scoreLabel && (
    <motion.span
      initial={entranceFrom(resolving, reduced, FADE_RISE.initial)}
      animate={FADE_RISE.animate}
      transition={transitionFor("base", reduced)}
      className="text-primary shrink-0 text-sm font-bold"
    >
      {scoreLabel}
    </motion.span>
  );

  if (slot.side === "SQUAD") {
    return (
      <div className="flex items-center gap-3">
        <span className="border-primary bg-primary/15 text-primary flex size-9 shrink-0 items-center justify-center rounded-full border text-[0.625rem] font-bold tracking-tight">
          {SQUAD_SHORT_CODE}
        </span>
        <div className="min-w-0 flex-1">
          <p
            className={`text-sm font-bold tracking-wide break-words uppercase ${NAME_TRANSITION} ${
              eliminated ? "text-muted-foreground line-through" : "text-primary"
            }`}
          >
            {squadDisplayName(squad)}
          </p>
          <p className="mt-1 flex flex-wrap items-center gap-2">
            {hasSquadName(squad) && (
              <span className="bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-[0.625rem] font-bold tracking-[0.12em]">
                YOUR SQUAD
              </span>
            )}
            <span className="text-muted-foreground text-[0.6875rem] font-semibold tracking-[0.14em]">
              AVG {squadRatingOf(squad)}
            </span>
          </p>
        </div>
        {score}
      </div>
    );
  }

  const { opponent } = slot;

  return (
    <div className="flex items-center gap-3">
      <TeamLogoBadge
        teamName={opponent.teamName}
        teamLogo={opponent.teamLogo}
        size="sm"
      />
      <div className="min-w-0 flex-1">
        <p
          className={`text-sm font-semibold break-words ${NAME_TRANSITION} ${
            eliminated
              ? "text-muted-foreground line-through"
              : "text-foreground"
          }`}
        >
          {opponent.seasonYear} {opponent.teamName}
        </p>
        <p className="mt-1 flex flex-wrap items-center gap-2">
          <span className="border-border text-muted-foreground rounded-md border px-1.5 py-0.5 text-[0.625rem] font-semibold tracking-[0.12em]">
            {opponent.seed} SEED
          </span>
          <span className="text-muted-foreground text-[0.6875rem] font-medium">
            {opponent.wins}-{opponent.losses}
          </span>
        </p>
        {!compact && (
          <p className="mt-1.5">
            <DifficultyMeter
              band={difficultyBand(opponent.pedigree)}
              dimmed={eliminated}
            />
          </p>
        )}
      </div>
      {score}
    </div>
  );
};

export default TeamSlotRow;
