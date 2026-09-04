import type { DraftState } from "@/lib/draft";
import type { DraftablePlayer, Position } from "@/types/game";

// How a court slot responds to the player currently under the pointer or on the
// end of a drag. The rules live here rather than in `DraftCourt`/`CourtSlot`
// because components are not tested, and an inverted branch here would invite a
// drop the reducer then rejects.

export type SlotDragState = "NONE" | "VALID" | "INVALID";

// A drag outranks a hover by construction: mid-drag the pointer is over the
// court, not the card, so a stale hover must never win.
//
// The winner is then checked against the roster on the board, because a card
// that unmounts under the pointer never fires `pointerleave` — drafting by
// click otherwise leaves the drafted player previewed, and since he is now a
// duplicate no slot would invite anything for the rest of the run.
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
    // With a player in hand, only the slots that would take him. With none, a
    // board with a team on it should still read as inviting.
    isInviting: wouldAccept && !isSelected && !isFilled,
    dragState:
      dragOver !== position || !previewPlayer
        ? "NONE"
        : accepts(previewPlayer, position)
          ? "VALID"
          : "INVALID",
  };
};

// The app's only looping animation, so its guards are a constraint rather than
// a preference: selection and a drag are stronger states that hold the glow
// steady, and reduced motion stops the loop outright — MotionConfig cannot.
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
