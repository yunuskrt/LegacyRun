"use client";

import React from "react";
import { motion, useReducedMotion } from "motion/react";
import { Lock } from "lucide-react";
import TeamLogoBadge from "@/components/draft/TeamLogoBadge";
import { FADE_RISE, entranceFrom, transitionFor } from "@/lib/motion";
import { CONFERENCE_NAME } from "@/lib/tournament-view";
import type { BracketOpponent } from "@/types/bracket";
import type { Conference } from "@/types/game";

type Props = {
  conference: Conference;
  opponent: BracketOpponent | null;
  roundsAway: number;
  // This mount is the unlock, not a later return with it already revealed.
  unlocking?: boolean;
};

// `opponent` is already guarded — nothing here may reach for the drawn champion.
const FinalsChampionStub = ({
  conference,
  opponent,
  roundsAway,
  unlocking = false,
}: Props) => {
  const reduced = useReducedMotion() ?? false;

  return (
    <div className="border-border/70 bg-card/70 rounded-xl border px-4 py-4">
      <p className="text-muted-foreground text-[0.625rem] font-semibold tracking-[0.16em]">
        {CONFERENCE_NAME[conference].toUpperCase()} CONFERENCE CHAMPION
      </p>

      {opponent ? (
        // The bracket remounts between stages, so this is an entrance, not a crossfade.
        <motion.div
          initial={entranceFrom(unlocking, reduced, FADE_RISE.initial)}
          animate={FADE_RISE.animate}
          transition={transitionFor("base", reduced)}
          className="mt-3 flex items-center gap-3"
        >
          <TeamLogoBadge
            teamName={opponent.teamName}
            teamLogo={opponent.teamLogo}
            size="sm"
          />
          <div className="min-w-0">
            <p className="text-foreground text-sm font-semibold break-words">
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
          </div>
        </motion.div>
      ) : (
        <>
          <div className="mt-3 flex items-center gap-3">
            <span className="bg-muted/60 size-9 shrink-0 rounded-lg" />
            <div>
              <p className="text-foreground flex items-center gap-2 text-sm font-semibold">
                <Lock className="size-3.5" aria-hidden="true" />
                Unknown
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                Revealed at the Conference Finals
              </p>
            </div>
          </div>
          <p className="mt-3">
            <span className="bg-muted/60 text-muted-foreground rounded-md px-2 py-1 text-[0.625rem] font-semibold tracking-[0.12em]">
              {roundsAway} {roundsAway === 1 ? "ROUND" : "ROUNDS"} AWAY
            </span>
          </p>
        </>
      )}
    </div>
  );
};

export default FinalsChampionStub;
