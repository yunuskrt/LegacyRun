import { describe, expect, it } from "vitest";
import { TRADITIONAL_SLOTS } from "@/data/formations";
import { MOCK_DRAFT_TEAMS } from "@/data/mock-draft-teams";
import { isSlotBreathing, slotMotionState } from "@/lib/draft-preview";
import {
  createDraftReducer,
  INITIAL_DRAFT_STATE,
  slotAcceptsPlayer,
} from "@/lib/draft";
import type { SlotDragState } from "@/lib/draft-preview";
import type { DraftablePlayer, Position } from "@/types/game";

const slots = TRADITIONAL_SLOTS;
const reduce = createDraftReducer(slots);

const team = MOCK_DRAFT_TEAMS.find((t) => t.teamSeasonId === "celtics-2008");
if (!team) throw new Error("missing fixture team celtics-2008");

const playerOf = (playerId: string): DraftablePlayer => {
  const player = team.players.find((p) => p.playerId === playerId);
  if (!player) throw new Error(`missing fixture player ${playerId}`);
  return player;
};

const pierce = playerOf("paul-pierce"); // SF
const rondo = playerOf("rajon-rondo"); // PG

// A real board: the Celtics offered, nothing drafted yet.
const offered = reduce(INITIAL_DRAFT_STATE, { type: "OFFER_TEAM", team });
const accepts = (player: DraftablePlayer, position: Position) =>
  slotAcceptsPlayer(offered, slots, player, position);

const slotAt = (position: Position, overrides = {}) =>
  slotMotionState({
    position,
    isFilled: false,
    isOpen: true,
    isSelected: false,
    previewPlayer: null,
    dragOver: null,
    accepts,
    ...overrides,
  });

describe("slotMotionState — invitation", () => {
  it("invites every open slot when nothing is previewed", () => {
    slots.forEach((position) => {
      expect(slotAt(position).isInviting).toBe(true);
    });
  });

  it("invites nothing when no team is on the board", () => {
    slots.forEach((position) => {
      expect(slotAt(position, { isOpen: false }).isInviting).toBe(false);
    });
  });

  it("narrows to only the slots the previewed player would fill", () => {
    const invited = slots.filter(
      (position) => slotAt(position, { previewPlayer: pierce }).isInviting
    );

    expect(invited).toEqual(["SF"]);
  });

  it("agrees with slotAcceptsPlayer for every fixture player and slot", () => {
    team.players.forEach((player) => {
      slots.forEach((position) => {
        expect(slotAt(position, { previewPlayer: player }).isInviting).toBe(
          accepts(player, position)
        );
      });
    });
  });

  it("never invites a filled slot, previewed or not", () => {
    expect(slotAt("SF", { isFilled: true, isOpen: false }).isInviting).toBe(
      false
    );
    expect(
      slotAt("SF", { isFilled: true, isOpen: false, previewPlayer: pierce })
        .isInviting
    ).toBe(false);
  });

  // Selection is a stronger state with its own treatment; two competing
  // signals on one slot is the "overwhelming" this phase avoids.
  it("never invites the selected slot", () => {
    expect(slotAt("SF", { isSelected: true }).isInviting).toBe(false);
    expect(
      slotAt("SF", { isSelected: true, previewPlayer: pierce }).isInviting
    ).toBe(false);
  });
});

describe("slotMotionState — drag response", () => {
  it("is NONE on every slot that is not the drag target", () => {
    slots
      .filter((position) => position !== "SF")
      .forEach((position) => {
        expect(
          slotAt(position, { previewPlayer: pierce, dragOver: "SF" }).dragState
        ).toBe("NONE");
      });
  });

  it("is NONE when a slot is dragged over with nothing in hand", () => {
    expect(slotAt("SF", { dragOver: "SF" }).dragState).toBe("NONE");
  });

  it("is VALID on a slot the dragged player would fill", () => {
    expect(
      slotAt("SF", { previewPlayer: pierce, dragOver: "SF" }).dragState
    ).toBe("VALID");
  });

  it("is INVALID on a slot the dragged player would not fill", () => {
    expect(slotAt("C", { previewPlayer: rondo, dragOver: "C" }).dragState).toBe(
      "INVALID"
    );
  });

  // The deny preview must never disagree with the rejection that follows.
  it("is VALID exactly when the reducer would take the drop", () => {
    team.players.forEach((player) => {
      slots.forEach((position) => {
        const { dragState } = slotAt(position, {
          previewPlayer: player,
          dragOver: position,
        });

        expect(dragState === "VALID").toBe(accepts(player, position));
        expect(dragState).not.toBe("NONE");
      });
    });
  });
});

describe("isSlotBreathing", () => {
  const base = {
    isInviting: true,
    isSelected: false,
    dragState: "NONE" as SlotDragState,
    reduced: false,
  };

  it("runs on an unselected invitation with no drag in play", () => {
    expect(isSlotBreathing(base)).toBe(true);
  });

  it("does not run on a slot that is not inviting", () => {
    expect(isSlotBreathing({ ...base, isInviting: false })).toBe(false);
  });

  // Hard rule: the app's only loop must never share a slot with the
  // selection treatment.
  it("does not run on the selected slot", () => {
    expect(isSlotBreathing({ ...base, isSelected: true })).toBe(false);
  });

  it("holds steady under either drag state", () => {
    expect(isSlotBreathing({ ...base, dragState: "VALID" })).toBe(false);
    expect(isSlotBreathing({ ...base, dragState: "INVALID" })).toBe(false);
  });

  // MotionConfig disables transforms but cannot stop a loop, so this is the
  // only thing keeping the app's one looping animation off a reduced-motion
  // screen.
  it("never runs under reduced motion, whatever else is true", () => {
    [true, false].forEach((isSelected) => {
      (["NONE", "VALID", "INVALID"] as SlotDragState[]).forEach((dragState) => {
        expect(
          isSlotBreathing({ ...base, reduced: true, isSelected, dragState })
        ).toBe(false);
      });
    });
  });
});
