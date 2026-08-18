"use client";

import React from "react";
import Link from "next/link";
import { useRun } from "@/components/play/RunProvider";
import { formatSeason } from "@/lib/format";

type Props = {};

const TournamentPage = ({}: Props) => {
  const { run } = useRun();

  if (!run) {
    return (
      <main className="bg-room flex flex-1 flex-col items-center justify-center gap-4 px-6 py-16">
        <p className="text-muted-foreground text-center text-lg">
          No squad in play. Draft a lineup to start a tournament.
        </p>
        <Link href="/play/draft" className="text-primary underline">
          Back to the draft
        </Link>
      </main>
    );
  }

  const { squad, conference } = run;

  return (
    <main className="bg-room flex flex-1 flex-col gap-6 px-6 py-16">
      <div className="text-muted-foreground mx-auto w-full max-w-2xl space-y-4 text-sm">
        <p>
          <strong className="text-foreground">Squad:</strong>{" "}
          {squad.name ?? "(unnamed)"}
        </p>
        <p>
          <strong className="text-foreground">Conference:</strong> {conference}
        </p>
        <ul className="space-y-1">
          {squad.players.map((player) => (
            <li key={player.playerSeasonId}>
              {player.position} — {player.name} · {player.teamName} ·{" "}
              {formatSeason(player.seasonYear)} · {player.rating}
            </li>
          ))}
        </ul>
        <p className="text-xs">Tournament step will be implemented.</p>
      </div>
    </main>
  );
};

export default TournamentPage;
