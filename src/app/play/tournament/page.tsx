"use client";

import React from "react";
import Link from "next/link";
import { useRun } from "@/components/play/RunProvider";
import {
  BRACKET_FETCH_MESSAGE,
  bracketRequestFor,
  requestBracket,
} from "@/lib/bracket-client";
import { formatSeason, formatSeasonShort } from "@/lib/format";
import type { BracketSlot } from "@/types/bracket";

type Props = {};

const describeSlot = (slot: BracketSlot | null, squadName: string): string => {
  if (!slot) return "TBD";
  if (slot.side === "SQUAD") return `${slot.bracketSlot}. ${squadName}`;

  const { opponent, bracketSlot } = slot;
  const prefix = bracketSlot === null ? "" : `${bracketSlot}. `;

  return `${prefix}${formatSeasonShort(opponent.seasonYear)} ${opponent.teamName} (P${opponent.pedigree}, ${opponent.seed} seed, ${opponent.wins}-${opponent.losses})`;
};

const TournamentPage = ({}: Props) => {
  const { run, bracket, setBracket } = useRun();
  const [error, setError] = React.useState<string | null>(null);
  const requestRef = React.useRef<AbortController | null>(null);

  React.useEffect(() => {
    if (!run || bracket || requestRef.current) return;

    const controller = new AbortController();
    requestRef.current = controller;

    const load = async () => {
      const result = await requestBracket(
        bracketRequestFor(run.squad, run.conference),
        fetch,
        controller.signal
      );

      if (controller.signal.aborted) return;

      if (result.ok) {
        setBracket(result.bracket);
      } else {
        setError(BRACKET_FETCH_MESSAGE[result.error]);
      }
    };

    void load();

    return () => {
      controller.abort();
      requestRef.current = null;
    };
  }, [run, bracket, setBracket]);

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
  const squadName = squad.name ?? "Your squad";

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

        {error && <p className="text-destructive">{error}</p>}

        {!bracket && !error && <p className="text-xs">Building bracket…</p>}

        {bracket && (
          <div className="space-y-4">
            <p>
              <strong className="text-foreground">Bracket:</strong> slot{" "}
              {bracket.squadSlot} · run seed {bracket.runSeed}
            </p>
            {bracket.rounds.map((round) => (
              <div key={round.id} className="space-y-1">
                <p className="text-foreground font-semibold">{round.label}</p>
                <ul className="space-y-1">
                  {round.matchups.map((matchup) => (
                    <li key={matchup.id}>
                      {describeSlot(matchup.home, squadName)} vs{" "}
                      {describeSlot(matchup.away, squadName)}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        <p className="text-xs">Match simulation will be implemented.</p>
      </div>
    </main>
  );
};

export default TournamentPage;
