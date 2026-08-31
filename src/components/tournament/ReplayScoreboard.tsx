import React from "react";
import TeamLogoBadge from "@/components/draft/TeamLogoBadge";
import TweenNumber from "@/components/tournament/TweenNumber";
import { periodLabel } from "@/lib/replay";
import type { SeriesSideView } from "@/lib/tournament-view";
import type { ReplayStatus } from "@/hooks/useReplay";

type Props = {
  home: SeriesSideView;
  away: SeriesSideView;
  homeScore: number;
  awayScore: number;
  period: number;
  clock: string;
  status: ReplayStatus;
};

const Crest = ({ side }: { side: SeriesSideView }) =>
  side.isSquad || !side.teamLogo ? (
    <span className="border-primary bg-primary/15 text-primary flex size-11 shrink-0 items-center justify-center rounded-full border text-[0.625rem] font-bold">
      {side.code}
    </span>
  ) : (
    <TeamLogoBadge teamName={side.name} teamLogo={side.teamLogo} size="sm" />
  );

const ReplayScoreboard = ({
  home,
  away,
  homeScore,
  awayScore,
  period,
  clock,
  status,
}: Props) => {
  const leader =
    homeScore === awayScore ? null : homeScore > awayScore ? "HOME" : "AWAY";

  const scoreClass = (side: "HOME" | "AWAY") =>
    `text-[clamp(3.25rem,11cqw,5.5rem)] leading-none font-bold tabular-nums ${
      leader === side ? "text-primary" : "text-foreground"
    }`;

  const periodText =
    status === "FINAL"
      ? "FINAL"
      : status === "PERIOD_BREAK"
        ? `END ${periodLabel(period)}`
        : periodLabel(period);

  return (
    <div className="@container bg-card shadow-panel rounded-2xl px-5 py-6">
      <div className="flex items-start justify-between gap-3">
        <Crest side={home} />
        <Crest side={away} />
      </div>

      <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div className="min-w-0 text-left">
          <TweenNumber value={homeScore} className={scoreClass("HOME")} />
          <p
            className={`mt-2 text-[0.625rem] font-bold tracking-[0.14em] break-words uppercase ${
              home.isSquad ? "text-primary" : "text-muted-foreground"
            }`}
          >
            {home.name}
          </p>
        </div>

        <div className="text-center">
          <p className="text-foreground text-xl font-bold tracking-[0.1em] sm:text-2xl">
            {periodText}
          </p>
          {status !== "FINAL" && (
            <p className="text-muted-foreground mt-1 text-sm tabular-nums">
              {clock}
            </p>
          )}
        </div>

        <div className="min-w-0 text-right">
          <TweenNumber value={awayScore} className={scoreClass("AWAY")} />
          <p
            className={`mt-2 text-[0.625rem] font-bold tracking-[0.14em] break-words uppercase ${
              away.isSquad ? "text-primary" : "text-muted-foreground"
            }`}
          >
            {away.name}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ReplayScoreboard;
