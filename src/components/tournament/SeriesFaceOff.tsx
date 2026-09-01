import React from "react";
import { motion } from "motion/react";
import { ROUND_LABELS } from "@/lib/bracket";
import { transitionFor } from "@/lib/motion";
import { faceOffSubLabel } from "@/lib/series-flow";
import { SQUAD_SHORT_CODE, hasSquadName } from "@/lib/tournament-view";
import type { BracketOpponent } from "@/types/bracket";
import type { BracketRoundId } from "@/types/bracket";
import type { Squad } from "@/types/game";

type Props = {
  round: BracketRoundId;
  squad: Squad;
  squadName: string;
  opponent: BracketOpponent | null;
};

const Crest = ({ code, isSquad }: { code: string; isSquad: boolean }) => (
  <span
    className={`flex size-20 items-center justify-center rounded-full border text-xl font-bold tracking-tight sm:size-24 sm:text-2xl ${
      isSquad
        ? "border-primary bg-primary/10 text-primary shadow-trophy"
        : "border-border bg-secondary text-muted-foreground"
    }`}
  >
    {code}
  </span>
);

const SeriesFaceOff = ({ round, squad, squadName, opponent }: Props) => {
  const named = hasSquadName(squad);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={transitionFor("base")}
      className="flex min-h-[60vh] flex-col items-center justify-center gap-8 px-4 text-center"
    >
      <p className="text-primary text-[0.6875rem] font-bold tracking-[0.22em]">
        {ROUND_LABELS[round].toUpperCase()}
      </p>

      <div className="flex w-full max-w-3xl items-start justify-center gap-6 sm:gap-12">
        <div className="flex min-w-0 flex-1 flex-col items-center gap-3">
          <Crest code={SQUAD_SHORT_CODE} isSquad />
          <h2 className="text-primary text-lg font-bold tracking-wide break-words uppercase sm:text-2xl">
            {squadName}
          </h2>
          <p className="text-muted-foreground text-[0.625rem] font-bold tracking-[0.16em]">
            {faceOffSubLabel(squad, named)}
          </p>
        </div>

        <span className="text-muted-foreground mt-6 text-xl font-bold tracking-[0.18em] sm:mt-8 sm:text-3xl">
          VS
        </span>

        <div className="flex min-w-0 flex-1 flex-col items-center gap-3">
          <Crest code={opponent?.teamSlug ?? "—"} isSquad={false} />
          <h2 className="text-foreground text-lg font-bold break-words sm:text-2xl">
            {opponent
              ? `${opponent.seasonYear} ${opponent.teamName}`
              : "Opponent"}
          </h2>
          {opponent && (
            <p className="text-muted-foreground flex items-center gap-2 text-[0.625rem] font-bold tracking-[0.16em]">
              <span className="border-border rounded-full border px-2 py-0.5">
                {opponent.seed} SEED
              </span>
              <span>
                {opponent.wins}-{opponent.losses}
              </span>
            </p>
          )}
        </div>
      </div>

      <p className="text-muted-foreground flex w-full max-w-sm items-center gap-4 text-[0.625rem] font-bold tracking-[0.2em]">
        <span className="bg-border h-px flex-1" />
        BEST OF SEVEN
        <span className="bg-border h-px flex-1" />
      </p>
    </motion.div>
  );
};

export default SeriesFaceOff;
