"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useRun } from "@/components/play/RunProvider";
import BracketStageView from "@/components/tournament/BracketStageView";
import RunResultScreen from "@/components/tournament/RunResultScreen";
import SeriesReplay from "@/components/tournament/SeriesReplay";
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
import { oppositeConference } from "@/lib/bracket";
import {
  finalsOpponent,
  isFinalsOpponentRevealed,
  nextSquadMatchup,
  postSeriesView,
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
    speed,
    setSpeed,
    mode,
    setMode,
    resetRun,
  } = useRun();
  const router = useRouter();
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
  const revealedThrough = revealedThroughFor(bracket);
  const rounds = visibleRounds(bracket, revealedThrough);
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

  const postSeries = postSeriesView(outcome, nextMatchup);

  const continueFromSeries = () => {
    setActiveMatchupId(null);
    setStage(postSeries.stage);
  };

  // The drawn Finals opponent is the only historical side of that matchup, so
  // reaching it means `champion` is already resolved.
  const finalsSlot = nextMatchup?.round === "NBA_FINALS" ? champion : null;

  const startNewRun = () => {
    resetRun();
    router.push("/play/draft");
  };

  // The archive shows the finished bracket in full: no masking, no "next up"
  // ring, and the far-conference champion revealed whatever round the run
  // ended in.
  const isArchive = stage === "ARCHIVE";
  const bracketRounds = isArchive ? bracket.rounds : rounds;
  const bracketChampion = isArchive ? finalsOpponent(bracket) : champion;

  const bracketView = (
    <BracketStageView
      conference={conference}
      squadName={squadName}
      isArchive={isArchive}
      nextMatchup={nextMatchup}
      finalsSlot={finalsSlot}
      display={{
        rounds: bracketRounds,
        squad,
        series,
        nextMatchupId: nextMatchup?.id ?? null,
        farConference,
        finalsOpponent: bracketChampion,
        roundsUntilFinals: roundsUntilFinals(bracket),
        revealedThrough,
        readOnly: isArchive,
      }}
      onPlayNextRound={playNextRound}
      onBackToResults={() => setStage("RESULT")}
    />
  );

  const resultView = (
    <RunResultScreen
      bracket={bracket}
      series={series}
      squad={squad}
      squadName={squadName}
      isChampion={outcome.kind === "CHAMPION"}
      onReviewBracket={() => setStage("ARCHIVE")}
      onNewRun={startNewRun}
    />
  );

  return (
    <main className="bg-room flex flex-1 flex-col gap-8 px-4 py-8 sm:px-6 lg:px-10">
      {/* The result screen lists the five itself, so the rail would repeat them. */}
      {stage !== "RESULT" && (
        <SquadRail squad={squad} conference={conference} />
      )}

      <TournamentStage stage={stage}>
        <div className="flex flex-col gap-8">
          {stage === "SERIES" && activeMatchup && activeSeries ? (
            <SeriesReplay
              matchup={activeMatchup}
              series={activeSeries}
              squad={squad}
              speed={speed}
              mode={mode}
              ctaLabel={postSeries.ctaLabel}
              onSpeedChange={setSpeed}
              onModeChange={setMode}
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
