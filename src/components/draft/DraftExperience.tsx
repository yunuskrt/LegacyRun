"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import DraftBoard from "@/components/draft/DraftBoard";
import DraftCourt from "@/components/draft/DraftCourt";
import DraftSectionHeading from "@/components/draft/DraftSectionHeading";
import DraftTopBar from "@/components/draft/DraftTopBar";
import { Button } from "@/components/ui/button";
import {
  canOfferTeam,
  canReroll,
  createDraftReducer,
  INITIAL_DRAFT_STATE,
  isDraftComplete,
  openPositions,
  playerAvailability,
  randomOtherSeason,
  randomOtherTeam,
  randomTeamSeason,
  TOTAL_REROLLS,
  validateDraft,
  type DraftRejection,
  type RerollKind,
} from "@/lib/draft";
import { cn } from "@/lib/utils";
import type { DraftablePlayer, DraftTeam, Position } from "@/types/game";

type Props = {
  teams: DraftTeam[];
  slots: readonly Position[];
};

const REJECTION_MESSAGE: Record<DraftRejection, string> = {
  NO_TEAM_OFFERED: "Get a random team before drafting.",
  NO_SLOT_SELECTED: "Select an open slot on the court first.",
  SLOT_FILLED: "That slot already has a player.",
  WRONG_POSITION: "Attempt to place in wrong position.",
  ALREADY_DRAFTED: "That player is already on your roster.",
};

const DraftExperience = ({ teams, slots }: Props) => {
  const router = useRouter();
  const reducer = React.useMemo(() => createDraftReducer(slots), [slots]);
  const [state, dispatch] = React.useReducer(reducer, INITIAL_DRAFT_STATE);

  const open = openPositions(state, slots);
  const isComplete = isDraftComplete(state, slots);

  const handleGetRandomTeam = () => {
    const team = randomTeamSeason(teams);
    if (!team) return;
    dispatch({ type: "OFFER_TEAM", team });
  };

  const handleReroll = (kind: RerollKind) => {
    const current = state.offeredTeam;
    if (!current || !canReroll(state, slots)) return;

    const team =
      kind === "ANOTHER_TEAM"
        ? randomOtherTeam(teams, current)
        : kind === "ANOTHER_SEASON"
          ? randomOtherSeason(teams, current)
          : randomTeamSeason(teams);

    if (!team) {
      toast.error(
        kind === "ANOTHER_SEASON"
          ? "No other season available for this franchise."
          : "No other team available."
      );
      return;
    }

    dispatch({ type: "REROLL", team });
  };

  const handleDraftPlayer = (player: DraftablePlayer, position: Position) => {
    const attempt = validateDraft(state, slots, player, position);
    if (!attempt.ok) {
      toast.error(REJECTION_MESSAGE[attempt.reason]);
      return;
    }
    dispatch({ type: "DRAFT_PLAYER", player, position });
  };

  const handleDropPlayer = (playerSeasonId: string, position: Position) => {
    const player = state.offeredTeam?.players.find(
      (candidate) => candidate.playerSeasonId === playerSeasonId
    );
    if (!player) return;
    handleDraftPlayer(player, position);
  };

  return (
    <main className="flex flex-1 flex-col gap-6">
      <DraftTopBar
        filledSlots={state.members.length}
        totalSlots={slots.length}
      />

      <div className="grid flex-1 gap-8 lg:grid-cols-[minmax(0,1.85fr)_minmax(0,1fr)] lg:items-start">
        <section>
          <DraftSectionHeading>Your Lineup</DraftSectionHeading>
          <DraftCourt
            slots={slots}
            members={state.members}
            hasActiveTeam={Boolean(state.offeredTeam)}
            selectedPosition={state.selectedPosition}
            onSelectSlot={(position) =>
              dispatch({ type: "SELECT_SLOT", position })
            }
            onDropPlayer={handleDropPlayer}
          />
        </section>

        <section>
          <DraftSectionHeading>Draft Board</DraftSectionHeading>
          <DraftBoard
            team={state.offeredTeam ?? undefined}
            selectedPosition={state.selectedPosition}
            availabilityOf={(player) =>
              playerAvailability(state, slots, player)
            }
            openPositions={open}
            rerollsLeft={state.rerollsLeft}
            totalRerolls={TOTAL_REROLLS}
            isComplete={isComplete}
            canGetTeam={canOfferTeam(state, slots)}
            canReroll={canReroll(state, slots)}
            onGetRandomTeam={handleGetRandomTeam}
            onReroll={handleReroll}
            onDraftPlayer={handleDraftPlayer}
          />

          <div className="mt-6">
            <Button
              type="button"
              variant={isComplete ? "default" : "secondary"}
              size="lg"
              disabled={!isComplete}
              onClick={() => router.push("/play/tournament")}
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
                Complete your {slots.length}-player lineup to continue.
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
};

export default DraftExperience;
