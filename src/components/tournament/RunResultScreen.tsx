import React from "react";
import { Crown, ShieldOff } from "lucide-react";
import RunPathList from "@/components/tournament/RunPathList";
import RunRecapStats from "@/components/tournament/RunRecapStats";
import RunSquadGrid from "@/components/tournament/RunSquadGrid";
import {
  CHAMPION_OVERLINE,
  defeatSubtitle,
  eliminationHeadline,
  eliminationRow,
  playoffRecord,
  runPath,
  runScoringLeader,
  signatureGame,
} from "@/lib/run-summary";
import type { Bracket } from "@/types/bracket";
import type { Squad } from "@/types/game";
import type { SeriesState } from "@/types/match";

type Props = {
  bracket: Bracket;
  series: readonly SeriesState[];
  squad: Squad;
  squadName: string;
  isChampion: boolean;
  onReviewBracket: () => void;
  onNewRun: () => void;
};

const RunResultScreen = ({
  bracket,
  series,
  squad,
  squadName,
  isChampion,
  onReviewBracket,
  onNewRun,
}: Props) => {
  const path = runPath(bracket, series);
  const eliminated = eliminationRow(path);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <header className="flex flex-col items-center gap-1 text-center">
        {isChampion ? (
          <Crown className="text-primary size-8" aria-hidden="true" />
        ) : (
          <ShieldOff className="text-destructive size-8" aria-hidden="true" />
        )}

        <p
          className={`text-[0.6875rem] font-bold tracking-[0.18em] ${
            isChampion ? "text-primary" : "text-destructive"
          }`}
        >
          {isChampion ? CHAMPION_OVERLINE : eliminationHeadline(eliminated)}
        </p>

        <h1
          className={`text-4xl font-bold tracking-wide uppercase sm:text-5xl ${
            isChampion ? "text-primary" : "text-destructive"
          }`}
        >
          {isChampion ? "NBA Champions" : "Run ended"}
        </h1>

        {/* The hero needs a subject, so an unnamed squad still gets a line —
            `squadName` is already the YOUR SQUAD fallback. */}
        <p className="text-foreground text-2xl font-bold tracking-wide break-words uppercase sm:text-3xl">
          {squadName}
        </p>

        {eliminated && (
          <p className="text-muted-foreground mt-1 text-sm">
            {defeatSubtitle(eliminated)}
          </p>
        )}
      </header>

      <RunSquadGrid players={squad.players} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <RunPathList path={path} />
        <RunRecapStats
          record={playoffRecord(path)}
          leader={runScoringLeader(path)}
          signature={signatureGame(path)}
          isChampion={isChampion}
        />
      </div>

      <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <button
          type="button"
          onClick={onNewRun}
          className="bg-gold text-primary-foreground min-h-11 w-full rounded-xl px-6 py-3 text-xs font-bold tracking-[0.16em] uppercase sm:w-auto"
        >
          Start a new run
        </button>
        <button
          type="button"
          onClick={onReviewBracket}
          className="border-border bg-secondary text-foreground min-h-11 w-full rounded-xl border px-6 py-3 text-xs font-bold tracking-[0.16em] uppercase sm:w-auto"
        >
          Review bracket
        </button>
      </div>
    </div>
  );
};

export default RunResultScreen;
