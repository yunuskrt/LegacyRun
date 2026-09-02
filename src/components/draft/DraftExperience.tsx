"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import DraftBoard from "@/components/draft/DraftBoard";
import DraftCourt from "@/components/draft/DraftCourt";
import DraftSectionHeading from "@/components/draft/DraftSectionHeading";
import DraftTopBar from "@/components/draft/DraftTopBar";
import SquadConfirmDialog from "@/components/draft/SquadConfirmDialog";
import { useRun } from "@/components/play/RunProvider";
import { Button } from "@/components/ui/button";
import {
  canOfferTeam,
  canReroll,
  createDraftReducer,
  INITIAL_DRAFT_STATE,
  isDraftComplete,
  openPositions,
  playerAvailability,
  slotAcceptsPlayer,
  TOTAL_REROLLS,
  validateDraft,
  type DraftRejection,
  type RerollKind,
} from "@/lib/draft";
import {
  DRAFT_FETCH_MESSAGE,
  requestDraftTeam,
  rerollRequest,
  type DraftRequest,
} from "@/lib/draft-client";
import { buildRun } from "@/lib/run";
import { cn } from "@/lib/utils";
import type {
  Conference,
  DraftablePlayer,
  DraftTeam,
  Position,
} from "@/types/game";

type Props = {
  slots: readonly Position[];
};

const REJECTION_MESSAGE: Record<DraftRejection, string> = {
  NO_TEAM_OFFERED: "Get a random team before drafting.",
  NO_SLOT_SELECTED: "Select an open slot on the court first.",
  SLOT_FILLED: "That slot already has a player.",
  WRONG_POSITION: "Attempt to place in wrong position.",
  ALREADY_DRAFTED: "That player is already on your roster.",
};

const DraftExperience = ({ slots }: Props) => {
  const router = useRouter();
  const { setRun } = useRun();
  const reducer = React.useMemo(() => createDraftReducer(slots), [slots]);
  const [state, dispatch] = React.useReducer(reducer, INITIAL_DRAFT_STATE);
  const [isFetchingTeam, setIsFetchingTeam] = React.useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);
  const [isHandingOff, setIsHandingOff] = React.useState(false);
  const [hoverPlayer, setHoverPlayer] = React.useState<DraftablePlayer | null>(
    null
  );
  const [dragPlayer, setDragPlayer] = React.useState<DraftablePlayer | null>(
    null
  );
  const inFlight = React.useRef<AbortController | null>(null);

  // A drag outranks a hover by construction: mid-drag the pointer is over the
  // court, not the card, so a stale hover must never win.
  //
  // Both are then checked against the roster on the board, because a card that
  // unmounts under the pointer never fires `pointerleave` — drafting by click
  // otherwise leaves the drafted player previewed, and since he is now a
  // duplicate no slot would invite anything for the rest of the run.
  const candidate = dragPlayer ?? hoverPlayer;
  const previewPlayer =
    candidate &&
    state.offeredTeam?.players.some(
      (player) => player.playerSeasonId === candidate.playerSeasonId
    )
      ? candidate
      : null;

  const open = openPositions(state, slots);
  const isComplete = isDraftComplete(state, slots);

  React.useEffect(() => () => inFlight.current?.abort(), []);

  // Aborting the previous request is the race guard: a superseded response
  // rejects before it can overwrite the newer team.
  const loadTeam = async (request: DraftRequest): Promise<DraftTeam | null> => {
    inFlight.current?.abort();
    const controller = new AbortController();
    inFlight.current = controller;
    setIsFetchingTeam(true);

    const result = await requestDraftTeam(request, fetch, controller.signal);

    if (controller.signal.aborted) return null;
    inFlight.current = null;
    setIsFetchingTeam(false);

    if (!result.ok) {
      toast.error(DRAFT_FETCH_MESSAGE[result.error]);
      return null;
    }

    return result.team;
  };

  const handleGetRandomTeam = async () => {
    if (!canOfferTeam(state, slots) || isFetchingTeam) return;

    const team = await loadTeam({ mode: "random" });
    if (team) dispatch({ type: "OFFER_TEAM", team });
  };

  const handleReroll = async (kind: RerollKind) => {
    const current = state.offeredTeam;
    if (!current || !canReroll(state, slots) || isFetchingTeam) return;

    // The reroll is only spent once a team actually arrives.
    const team = await loadTeam(rerollRequest(kind, current.teamSeasonId));
    if (team) dispatch({ type: "REROLL", team });
  };

  const handleDraftPlayer = (player: DraftablePlayer, position: Position) => {
    const attempt = validateDraft(state, slots, player, position);
    if (!attempt.ok) {
      toast.error(REJECTION_MESSAGE[attempt.reason]);
      return;
    }
    dispatch({ type: "DRAFT_PLAYER", player, position });
  };

  const handleConfirmSquad = (name: string, conference: Conference) => {
    setRun(buildRun(state.members, slots, name, conference));
    // Unmounting skips the dialog's close animation, so its exit and the
    // arriving page's entrance never run over each other.
    setIsHandingOff(true);
    router.push("/play/tournament");
  };

  const handleDropPlayer = (playerSeasonId: string, position: Position) => {
    // `dragend` also clears this, but the two can arrive in either order.
    setDragPlayer(null);
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
            previewPlayer={previewPlayer}
            acceptsPlayer={(player, position) =>
              slotAcceptsPlayer(state, slots, player, position)
            }
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
            isFetchingTeam={isFetchingTeam}
            canGetTeam={canOfferTeam(state, slots) && !isFetchingTeam}
            canReroll={canReroll(state, slots) && !isFetchingTeam}
            onGetRandomTeam={handleGetRandomTeam}
            onReroll={handleReroll}
            onDraftPlayer={handleDraftPlayer}
            onHoverPlayer={setHoverPlayer}
            onDragPlayer={setDragPlayer}
          />

          <div className="mt-6">
            <Button
              type="button"
              variant={isComplete ? "default" : "secondary"}
              size="lg"
              disabled={!isComplete}
              onClick={() => setIsConfirmOpen(true)}
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

      {!isHandingOff && (
        <SquadConfirmDialog
          open={isConfirmOpen}
          members={state.members}
          slots={slots}
          onOpenChange={setIsConfirmOpen}
          onConfirm={handleConfirmSquad}
        />
      )}
    </main>
  );
};

export default DraftExperience;
