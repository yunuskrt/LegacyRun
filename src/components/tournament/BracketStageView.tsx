"use client";

import React from "react";
import { Crown, Trophy } from "lucide-react";
import BracketLadder from "@/components/tournament/BracketLadder";
import BracketSpine from "@/components/tournament/BracketSpine";
import { ROUND_LABELS } from "@/lib/bracket";
import { CONFERENCE_NAME, PLAY_CTA } from "@/lib/tournament-view";
import type { BracketDisplayProps } from "@/lib/tournament-view";
import type { BracketMatchup, BracketOpponent } from "@/types/bracket";
import type { Conference } from "@/types/game";

type Props = {
  conference: Conference;
  squadName: string;
  isArchive: boolean;
  nextMatchup: BracketMatchup | null;
  finalsSlot: BracketOpponent | null;
  display: BracketDisplayProps;
  onPlayNextRound: () => void;
  onBackToResults: () => void;
};

const BracketStageView = ({
  conference,
  squadName,
  isArchive,
  nextMatchup,
  finalsSlot,
  display,
  onPlayNextRound,
  onBackToResults,
}: Props) => {
  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-primary text-[0.6875rem] font-semibold tracking-[0.18em]">
            {CONFERENCE_NAME[conference].toUpperCase()} CONFERENCE BRACKET
          </p>
          <h1 className="text-foreground mt-1 flex items-center gap-3 text-3xl font-bold sm:text-4xl">
            {!isArchive && nextMatchup?.round === "NBA_FINALS" && (
              <Trophy className="text-primary size-7" aria-hidden="true" />
            )}
            {isArchive
              ? "The run is complete"
              : nextMatchup
                ? ROUND_LABELS[nextMatchup.round]
                : "Your bracket"}
          </h1>
        </div>

        {isArchive ? (
          <button
            type="button"
            onClick={onBackToResults}
            className="border-border bg-secondary text-foreground min-h-11 rounded-xl border px-6 py-3 text-xs font-bold tracking-[0.16em] uppercase"
          >
            Back to results
          </button>
        ) : (
          nextMatchup && (
            <button
              type="button"
              onClick={onPlayNextRound}
              className="bg-gold text-primary-foreground rounded-xl px-6 py-3 text-xs font-bold tracking-[0.16em] uppercase"
            >
              {PLAY_CTA[nextMatchup.round]}
            </button>
          )
        )}
      </header>

      {!isArchive && finalsSlot && (
        <p className="border-primary/50 bg-card/60 text-foreground flex items-center gap-3 rounded-xl border px-4 py-3 text-[0.6875rem] font-semibold tracking-[0.14em] uppercase">
          <Crown className="text-primary size-4 shrink-0" aria-hidden="true" />
          One series from the title — {squadName} vs {finalsSlot.seasonYear}{" "}
          {finalsSlot.teamName}
        </p>
      )}

      <div className="hidden md:block">
        <BracketLadder {...display} />
      </div>

      <div className="md:hidden">
        <BracketSpine {...display} />
      </div>
    </>
  );
};

export default BracketStageView;
