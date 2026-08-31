"use client";

import React from "react";
import Link from "next/link";
import { Crown, Trophy } from "lucide-react";
import { useRun } from "@/components/play/RunProvider";
import BracketLadder from "@/components/tournament/BracketLadder";
import BracketSpine from "@/components/tournament/BracketSpine";
import SeriesResultCard from "@/components/tournament/SeriesResultCard";
import SquadRail from "@/components/tournament/SquadRail";
import TournamentEmptyState from "@/components/tournament/TournamentEmptyState";
import TournamentStage from "@/components/tournament/TournamentStage";
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
import { findMatchup, playMatchup, resolveOpponentMatchups } from "@/lib/match";
import { ROUND_LABELS, oppositeConference } from "@/lib/bracket";
import {
  CONFERENCE_NAME,
  PLAY_CTA,
  ROUND_PHRASE,
  finalsOpponent,
  isFinalsOpponentRevealed,
  nextSquadMatchup,
  revealedThroughFor,
  roundsUntilFinals,
  runOutcome,
  seriesFor,
  squadDisplayName,
  visibleRounds,
} from "@/lib/tournament-view";
import type { StageId } from "@/components/tournament/TournamentStage";

type Props = {};

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
  const [retryToken, setRetryToken] = React.useState(0);
  const [stage, setStage] = React.useState<StageId>("BRACKET");
  const [activeMatchupId, setActiveMatchupId] = React.useState<string | null>(
    null
  );
  const farHalfRef = React.useRef(false);

  React.useEffect(() => {
    if (!run || bracket) return;

    const controller = new AbortController();

    const load = async () => {
      const result = await requestBracket(
        bracketRequestFor(run.squad, run.conference),
        fetch,
        controller.signal
      );

      if (controller.signal.aborted) return;

      if (result.ok) setBracket(result.bracket);
      else setError(BRACKET_FETCH_MESSAGE[result.error]);
    };

    void load();

    return () => controller.abort();
  }, [run, bracket, setBracket, retryToken]);

  React.useEffect(() => {
    if (!run || !bracket || matchData) return;

    const controller = new AbortController();

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

    return () => controller.abort();
  }, [run, bracket, matchData, setMatchData, retryToken]);

  // The far half plays itself out on arrival; `visibleRounds` is what keeps it
  // hidden until the squad has completed the same round.
  React.useEffect(() => {
    if (!run || !bracket || !matchData || farHalfRef.current) return;

    farHalfRef.current = true;

    const resolved = resolveOpponentMatchups(
      bracket,
      matchData,
      squadDisplayName(run.squad),
      bracket.runSeed
    );

    setBracket(resolved.bracket);
    setSeries((current) => [...current, ...resolved.series]);
  }, [run, bracket, matchData, setBracket, setSeries]);

  const retry = () => {
    setError(null);
    setRetryToken((current) => current + 1);
  };

  if (!run) {
    return (
      <main className="bg-room flex flex-1 flex-col justify-center px-6 py-10">
        <TournamentEmptyState kind="NO_RUN" />
      </main>
    );
  }

  const { squad, conference } = run;

  if (error) {
    return (
      <main className="bg-room flex flex-1 flex-col justify-center px-6 py-10">
        <TournamentEmptyState kind="ERROR" message={error} onRetry={retry} />
      </main>
    );
  }

  if (!bracket || !matchData) {
    return (
      <main className="bg-room flex flex-1 flex-col justify-center px-6 py-10">
        <TournamentEmptyState kind="LOADING" />
      </main>
    );
  }

  const nextMatchup = nextSquadMatchup(bracket);
  const rounds = visibleRounds(bracket, revealedThroughFor(bracket));
  const outcome = runOutcome(bracket, series);
  const farConference = oppositeConference(conference);
  const champion = isFinalsOpponentRevealed(bracket)
    ? finalsOpponent(bracket)
    : null;
  const squadName = squadDisplayName(squad);

  const activeMatchup = activeMatchupId
    ? findMatchup(bracket, activeMatchupId)
    : null;
  const activeSeries = activeMatchupId
    ? seriesFor(series, activeMatchupId)
    : null;

  const playNextRound = () => {
    if (!nextMatchup) return;

    const played = playMatchup(
      bracket,
      nextMatchup.id,
      matchData,
      squadName,
      bracket.runSeed
    );

    if (!played) return;

    setBracket(played.bracket);
    setSeries((current) => [...current, played.series]);
    setActiveMatchupId(nextMatchup.id);
    setStage("SERIES");
  };

  const continueFromSeries = () => {
    setActiveMatchupId(null);
    setStage(outcome.kind === "IN_PROGRESS" ? "BRACKET" : "RESULT");
  };

  const seriesCtaLabel =
    outcome.kind === "IN_PROGRESS" && nextMatchup
      ? `Continue to ${ROUND_PHRASE[nextMatchup.round]}`
      : outcome.kind === "CHAMPION"
        ? "See the result"
        : "See how the run ended";

  const finalsSlot =
    nextMatchup?.round === "NBA_FINALS"
      ? nextMatchup.home?.side === "OPPONENT"
        ? nextMatchup.home.opponent
        : nextMatchup.away?.side === "OPPONENT"
          ? nextMatchup.away.opponent
          : null
      : null;

  const bracketView = (
    <>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-primary text-[0.6875rem] font-semibold tracking-[0.18em]">
            {CONFERENCE_NAME[conference].toUpperCase()} CONFERENCE BRACKET
          </p>
          <h1 className="text-foreground mt-1 flex items-center gap-3 text-3xl font-bold sm:text-4xl">
            {nextMatchup?.round === "NBA_FINALS" && (
              <Trophy className="text-primary size-7" aria-hidden="true" />
            )}
            {nextMatchup ? ROUND_LABELS[nextMatchup.round] : "Your bracket"}
          </h1>
        </div>

        {nextMatchup && (
          <button
            type="button"
            onClick={playNextRound}
            className="bg-gold text-primary-foreground rounded-xl px-6 py-3 text-xs font-bold tracking-[0.16em] uppercase"
          >
            {PLAY_CTA[nextMatchup.round]}
          </button>
        )}
      </header>

      {finalsSlot && (
        <p className="border-primary/50 bg-card/60 text-foreground flex items-center gap-3 rounded-xl border px-4 py-3 text-[0.6875rem] font-semibold tracking-[0.14em] uppercase">
          <Crown className="text-primary size-4 shrink-0" aria-hidden="true" />
          One series from the title — {squadName} vs {finalsSlot.seasonYear}{" "}
          {finalsSlot.teamName}
        </p>
      )}

      <div className="hidden md:block">
        <BracketLadder
          rounds={rounds}
          squad={squad}
          series={series}
          nextMatchupId={nextMatchup?.id ?? null}
          farConference={farConference}
          finalsOpponent={champion}
          roundsUntilFinals={roundsUntilFinals(bracket)}
        />
      </div>

      <div className="md:hidden">
        <BracketSpine
          rounds={rounds}
          squad={squad}
          series={series}
          nextMatchupId={nextMatchup?.id ?? null}
          farConference={farConference}
          finalsOpponent={champion}
          roundsUntilFinals={roundsUntilFinals(bracket)}
        />
      </div>
    </>
  );

  const resultView = (
    <div className="mx-auto w-full max-w-xl py-10 text-center">
      <h1
        className={`text-3xl font-bold tracking-wide uppercase ${
          outcome.kind === "CHAMPION" ? "text-primary" : "text-destructive"
        }`}
      >
        {outcome.kind === "CHAMPION" ? "NBA Champions" : "Run ended"}
      </h1>
      <p className="text-foreground mt-3 text-lg font-semibold">{squadName}</p>
      {outcome.kind === "ELIMINATED" && (
        <p className="text-muted-foreground mt-2 text-sm">
          Eliminated in {ROUND_PHRASE[outcome.round]}.
        </p>
      )}
      <div className="mt-8 flex flex-col gap-3">
        <button
          type="button"
          onClick={() => setStage("BRACKET")}
          className="border-border text-muted-foreground rounded-lg border px-4 py-3 text-xs font-semibold tracking-[0.16em] uppercase"
        >
          Review bracket
        </button>
        <Link
          href="/play/draft"
          className="text-primary text-sm font-semibold underline"
        >
          Start a new run
        </Link>
      </div>
    </div>
  );

  return (
    <main className="bg-room flex flex-1 flex-col gap-8 px-4 py-8 sm:px-6 lg:px-10">
      <SquadRail squad={squad} conference={conference} />

      <TournamentStage stage={stage}>
        <div className="flex flex-col gap-8">
          {stage === "SERIES" && activeMatchup && activeSeries ? (
            <SeriesResultCard
              matchup={activeMatchup}
              series={activeSeries}
              squad={squad}
              ctaLabel={seriesCtaLabel}
              onContinue={continueFromSeries}
            />
          ) : stage === "RESULT" ? (
            resultView
          ) : (
            bracketView
          )}
        </div>
      </TournamentStage>
    </main>
  );
};

export default TournamentPage;
