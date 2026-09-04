import React from "react";
import TeamSlotRow from "@/components/tournament/TeamSlotRow";
import { seriesScoreLabel, visibleSeriesFor } from "@/lib/tournament-view";
import type { MatchupCardState } from "@/lib/tournament-view";
import type { BracketMatchup } from "@/types/bracket";
import type { Squad } from "@/types/game";
import type { SeriesState } from "@/types/match";

type Props = {
  matchup: BracketMatchup;
  state: MatchupCardState;
  squad: Squad;
  series: readonly SeriesState[];
  compact?: boolean;
  // The result just became visible, so the badges play in rather than mount there.
  resolving?: boolean;
};

const MatchupCard = ({
  matchup,
  state,
  squad,
  series,
  compact = false,
  resolving = false,
}: Props) => {
  const { home, away } = matchup;

  if (!home || !away) {
    return (
      <div className="border-border/60 text-muted-foreground flex min-h-28 items-center justify-center rounded-xl border border-dashed px-4 py-6 text-[0.6875rem] font-semibold tracking-[0.18em]">
        AWAITING WINNER
      </div>
    );
  }

  const played = visibleSeriesFor(matchup, series);
  const homeScore = seriesScoreLabel(played, "HOME");
  const awayScore = seriesScoreLabel(played, "AWAY");

  return (
    <div
      className={`rounded-xl border px-4 py-4 ${
        state === "NEXT"
          ? "border-primary bg-card shadow-trophy"
          : "border-border/70 bg-card/70"
      }`}
    >
      {state === "NEXT" && (
        <div className="mb-3 flex items-center justify-between gap-3">
          <span className="bg-primary text-primary-foreground rounded-full px-2.5 py-0.5 text-[0.625rem] font-bold tracking-[0.12em]">
            NEXT UP
          </span>
          <span className="text-muted-foreground text-[0.625rem] font-semibold tracking-[0.16em]">
            BEST OF SEVEN
          </span>
        </div>
      )}

      <TeamSlotRow
        slot={home}
        squad={squad}
        scoreLabel={homeScore}
        eliminated={played !== null && homeScore === null}
        compact={compact}
        resolving={resolving}
      />

      <div className="my-3 flex items-center gap-3">
        <span className="bg-border/70 h-px flex-1" />
        <span className="text-muted-foreground text-[0.625rem] font-semibold tracking-[0.16em]">
          VS
        </span>
        <span className="bg-border/70 h-px flex-1" />
      </div>

      <TeamSlotRow
        slot={away}
        squad={squad}
        scoreLabel={awayScore}
        eliminated={played !== null && awayScore === null}
        compact={compact}
        resolving={resolving}
      />
    </div>
  );
};

export default MatchupCard;
