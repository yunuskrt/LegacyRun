import React from "react";
import { ShieldCheck } from "lucide-react";
import DraftBoard from "@/components/draft/DraftBoard";
import DraftCourt from "@/components/draft/DraftCourt";
import DraftSectionHeading from "@/components/draft/DraftSectionHeading";
import DraftTopBar from "@/components/draft/DraftTopBar";
import { Button } from "@/components/ui/button";
import { MOCK_DRAFT_TEAMS, MOCK_SQUAD, TRADITIONAL_SLOTS } from "@/data";
import { cn } from "@/lib/utils";

type Props = {};

// Phase 5 is UI only — this stands in for the draft state Phase 6 introduces.
// 0 renders the empty board, 5 the completed lineup.
const DRAFTED_COUNT = 2;
const OFFERED_TEAM_SEASON_ID = "celtics-2008";
const TOTAL_REROLLS = 3;

const DraftPage = ({}: Props) => {
  const members = MOCK_SQUAD.players.slice(0, DRAFTED_COUNT);
  const filledPositions = new Set(members.map((member) => member.position));
  const openPositions = TRADITIONAL_SLOTS.filter(
    (position) => !filledPositions.has(position)
  );
  const isComplete = openPositions.length === 0;

  const activeTeam =
    DRAFTED_COUNT > 0 && !isComplete
      ? MOCK_DRAFT_TEAMS.find(
          (team) => team.teamSeasonId === OFFERED_TEAM_SEASON_ID
        )
      : undefined;

  return (
    <main className="flex flex-1 flex-col gap-6">
      <DraftTopBar
        filledSlots={members.length}
        totalSlots={TRADITIONAL_SLOTS.length}
      />

      <div className="grid flex-1 gap-8 lg:grid-cols-[minmax(0,1.85fr)_minmax(0,1fr)] lg:items-start">
        <section>
          <DraftSectionHeading>Your Lineup</DraftSectionHeading>
          <DraftCourt
            slots={TRADITIONAL_SLOTS}
            members={members}
            hasActiveTeam={Boolean(activeTeam)}
          />
        </section>

        <section>
          <DraftSectionHeading>Draft Board</DraftSectionHeading>
          <DraftBoard
            team={activeTeam}
            openPositions={openPositions}
            rerollsLeft={TOTAL_REROLLS}
            totalRerolls={TOTAL_REROLLS}
            isComplete={isComplete}
          />

          <div className="mt-6">
            <Button
              type="button"
              variant={isComplete ? "default" : "secondary"}
              size="lg"
              disabled={!isComplete}
              className={cn(
                "h-14 w-full text-base font-bold tracking-[0.18em] uppercase",
                isComplete && "bg-gold"
              )}
            >
              {isComplete && <ShieldCheck className="size-5" />}
              Start Tournament
            </Button>
            {!isComplete && (
              <p className="text-muted-foreground mt-3 text-center text-sm">
                Complete your {TRADITIONAL_SLOTS.length}-player lineup to
                continue.
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
};

export default DraftPage;
