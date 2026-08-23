"use client";

import React from "react";
import Link from "next/link";
import { useRun } from "@/components/play/RunProvider";
import {
  BRACKET_FETCH_MESSAGE,
  bracketRequestFor,
  requestBracket,
} from "@/lib/bracket-client";
import {
  MATCH_FETCH_MESSAGE,
  matchDataRequestFor,
  requestMatchData,
} from "@/lib/match-client";
import {
  allMatchups,
  findMatchup,
  isSquadMatchup,
  playMatchup,
  resolveOpponentMatchups,
} from "@/lib/match";
import { ROUND_LABELS } from "@/lib/bracket";
import { formatSeason, formatSeasonShort } from "@/lib/format";
import type { BracketMatchup, BracketSlot } from "@/types/bracket";
import type { MatchSideId, SeriesState } from "@/types/match";

type Props = {};

const describeSlot = (slot: BracketSlot | null, squadName: string): string => {
  if (!slot) return "TBD";
  if (slot.side === "SQUAD") return `${slot.bracketSlot}. ${squadName}`;

  const { opponent, bracketSlot } = slot;
  const prefix = bracketSlot === null ? "" : `${bracketSlot}. `;

  return `${prefix}${formatSeasonShort(opponent.seasonYear)} ${opponent.teamName} (P${opponent.pedigree}, ${opponent.seed} seed, ${opponent.wins}-${opponent.losses})`;
};

const squadSideOf = (matchup: BracketMatchup): MatchSideId =>
  matchup.home?.side === "SQUAD" ? "HOME" : "AWAY";

const seriesHeadline = (
  series: SeriesState,
  matchup: BracketMatchup,
  squadName: string
): string => {
  const home = describeSlot(matchup.home, squadName);
  const away = describeSlot(matchup.away, squadName);
  const winner = series.winner === "HOME" ? home : away;

  return `${home} ${series.homeWins}-${series.awayWins} ${away} — ${winner} wins`;
};

const TournamentPage = ({}: Props) => {
  const {
    run,
    bracket,
    setBracket,
    matchData,
    setMatchData,
    series,
    setSeries,
  } = useRun();
  const [error, setError] = React.useState<string | null>(null);
  const requestRef = React.useRef<AbortController | null>(null);
  const matchRequestRef = React.useRef<AbortController | null>(null);
  const farHalfRef = React.useRef(false);

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

  React.useEffect(() => {
    if (!run || !bracket || matchData || matchRequestRef.current) return;

    const controller = new AbortController();
    matchRequestRef.current = controller;

    const load = async () => {
      const result = await requestMatchData(
        matchDataRequestFor(run.squad, bracket),
        fetch,
        controller.signal
      );

      if (controller.signal.aborted) return;

      if (result.ok) setMatchData(result.data);
      else setError(MATCH_FETCH_MESSAGE[result.error]);
    };

    void load();

    return () => {
      controller.abort();
      matchRequestRef.current = null;
    };
  }, [run, bracket, matchData, setMatchData]);

  // The far half plays itself out so the bracket can show who is coming.
  React.useEffect(() => {
    if (!run || !bracket || !matchData || farHalfRef.current) return;

    farHalfRef.current = true;

    const resolved = resolveOpponentMatchups(
      bracket,
      matchData,
      run.squad.name ?? "Your squad",
      bracket.runSeed
    );

    setBracket(resolved.bracket);
    setSeries((current) => [...current, ...resolved.series]);
  }, [run, bracket, matchData, setBracket, setSeries]);

  const nextMatchup =
    bracket && matchData
      ? (allMatchups(bracket).find(
          (matchup) =>
            isSquadMatchup(matchup) &&
            !matchup.winner &&
            matchup.home &&
            matchup.away
        ) ?? null)
      : null;

  const playNextRound = () => {
    if (!run || !bracket || !matchData || !nextMatchup) return;

    const played = playMatchup(
      bracket,
      nextMatchup.id,
      matchData,
      run.squad.name ?? "Your squad",
      bracket.runSeed
    );

    if (!played) return;

    setBracket(played.bracket);
    setSeries((current) => [...current, played.series]);
  };

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

  const squadSeries = bracket
    ? series.flatMap((entry) => {
        const matchup = findMatchup(bracket, entry.matchupId);

        return matchup && isSquadMatchup(matchup) ? [{ entry, matchup }] : [];
      })
    : [];

  const eliminated = squadSeries.find(
    ({ entry, matchup }) => entry.winner !== squadSideOf(matchup)
  );
  const champion = squadSeries.find(
    ({ entry, matchup }) =>
      matchup.round === "NBA_FINALS" && entry.winner === squadSideOf(matchup)
  );

  const outcome = eliminated
    ? `Eliminated in ${ROUND_LABELS[eliminated.matchup.round]}.`
    : champion
      ? `${squadName} are NBA champions.`
      : null;

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
                  {round.matchups.map((matchup) => {
                    const played = series.find(
                      (entry) => entry.matchupId === matchup.id
                    );

                    return (
                      <li key={matchup.id}>
                        {describeSlot(matchup.home, squadName)} vs{" "}
                        {describeSlot(matchup.away, squadName)}
                        {played && (
                          <span className="text-foreground">
                            {" "}
                            — {played.homeWins}-{played.awayWins},{" "}
                            {describeSlot(matchup.winner, squadName)} advances
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}

        {bracket && !matchData && !error && (
          <p className="text-xs">Loading rosters…</p>
        )}

        {nextMatchup && (
          <button
            type="button"
            onClick={playNextRound}
            className="bg-primary text-primary-foreground rounded px-4 py-2 text-sm font-semibold"
          >
            Play {nextMatchup.round.replace(/_/g, " ").toLowerCase()}
          </button>
        )}

        {squadSeries.length > 0 && (
          <div className="space-y-3">
            <p className="text-foreground font-semibold">Your series</p>
            {squadSeries.map(({ entry, matchup }) => (
              <div key={entry.matchupId} className="space-y-1">
                <p className="text-foreground">
                  {seriesHeadline(entry, matchup, squadName)}
                </p>
                <ul className="space-y-0.5 text-xs">
                  {entry.games.map((game) => (
                    <li key={game.seed}>
                      Game {game.gameNumber}: {game.homeScore}-{game.awayScore}
                      {game.periodScores.length > 4 &&
                        ` (${game.periodScores.length - 4}OT)`}{" "}
                      · top scorer {game.scoring[0]?.playerName} (
                      {game.scoring[0]?.points})
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {outcome && <p className="text-foreground font-semibold">{outcome}</p>}
      </div>
    </main>
  );
};

export default TournamentPage;
