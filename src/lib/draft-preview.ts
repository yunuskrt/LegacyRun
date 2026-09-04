import type { DraftState } from "@/lib/draft";
import type { DraftablePlayer, Position } from "@/types/game";

// Here rather than in the court because components are not tested.

export type SlotDragState = "NONE" | "VALID" | "INVALID";

// Drag outranks hover; both are board-checked, since a stale preview blocks every slot.
export const resolvePreviewPlayer = (
  state: DraftState,
  dragPlayer: DraftablePlayer | null,
  hoverPlayer: DraftablePlayer | null
): DraftablePlayer | null => {
  const candidate = dragPlayer ?? hoverPlayer;
  if (!candidate) return null;

  const isOnBoard = state.offeredTeam?.players.some(
    (player) => player.playerSeasonId === candidate.playerSeasonId
  );

  return isOnBoard ? candidate : null;
};

type SlotInput = {
  position: Position;
  isFilled: boolean;
  isOpen: boolean;
  isSelected: boolean;
  previewPlayer: DraftablePlayer | null;
  dragOver: Position | null;
  accepts: (player: DraftablePlayer, position: Position) => boolean;
};

export type SlotMotionState = {
  isInviting: boolean;
  dragState: SlotDragState;
};

export const slotMotionState = ({
  position,
  isFilled,
  isOpen,
  isSelected,
  previewPlayer,
  dragOver,
  accepts,
}: SlotInput): SlotMotionState => {
  const wouldAccept = previewPlayer ? accepts(previewPlayer, position) : isOpen;

  return {
    // With a player in hand, only the slots that would take him; with none, all open ones.
    isInviting: wouldAccept && !isSelected && !isFilled,
    dragState:
      dragOver !== position || !previewPlayer
        ? "NONE"
        : accepts(previewPlayer, position)
          ? "VALID"
          : "INVALID",
  };
};

// Reduced motion must stop this loop explicitly — MotionConfig cannot stop a loop.
export const isSlotBreathing = ({
  isInviting,
  isSelected,
  dragState,
  reduced,
}: {
  isInviting: boolean;
  isSelected: boolean;
  dragState: SlotDragState;
  reduced: boolean;
}): boolean => isInviting && !isSelected && dragState === "NONE" && !reduced;
