import React from "react";
import { recordLabel, signatureLine } from "@/lib/run-summary";
import type {
  PlayoffRecord,
  ScoringLeader,
  SignatureGame,
} from "@/lib/run-summary";

type Props = {
  record: PlayoffRecord;
  leader: ScoringLeader | null;
  signature: SignatureGame | null;
  isChampion: boolean;
};

const Panel = ({
  heading,
  children,
  className = "",
}: {
  heading: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <section
    className={`border-border/70 bg-card/60 rounded-2xl border px-4 py-4 sm:px-5 sm:py-5 ${className}`}
  >
    <h2 className="text-muted-foreground text-[0.625rem] font-semibold tracking-[0.18em]">
      {heading}
    </h2>
    {children}
  </section>
);

const RunRecapStats = ({ record, leader, signature, isChampion }: Props) => (
  <div className="flex flex-col gap-4">
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Panel heading="PLAYOFF RECORD">
        <p className="text-foreground mt-3 text-4xl font-bold tabular-nums">
          {recordLabel(record)}
        </p>
      </Panel>

      <Panel heading="RUN SCORING LEADER">
        {leader ? (
          <>
            <p className="text-primary mt-3 text-sm font-bold break-words">
              {leader.playerName}
            </p>
            <p className="text-foreground text-4xl font-bold tabular-nums">
              {leader.pointsPerGame.toFixed(1)}
            </p>
            <p className="text-muted-foreground text-xs">points per game</p>
          </>
        ) : (
          <p className="text-muted-foreground mt-3 text-sm">
            No games were played.
          </p>
        )}
      </Panel>
    </div>

    {signature && (
      <section
        className={`bg-card/60 rounded-2xl border px-4 py-4 sm:px-5 sm:py-5 ${
          isChampion ? "border-primary/60" : "border-destructive/60"
        }`}
      >
        <h2
          className={`text-[0.625rem] font-semibold tracking-[0.18em] ${
            isChampion ? "text-primary" : "text-destructive"
          }`}
        >
          SIGNATURE GAME
        </h2>
        <p className="text-foreground mt-3 text-sm font-semibold break-words">
          {signatureLine(signature)}
        </p>
        {signature.scorerName && (
          <p className="text-muted-foreground mt-1 text-xs break-words">
            {signature.scorerName} {signature.scorerPoints} points
          </p>
        )}
      </section>
    )}
  </div>
);

export default RunRecapStats;
