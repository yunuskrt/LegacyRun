import { describe, expect, it } from "vitest";
import { TRADITIONAL_SLOTS } from "@/data/formations";
import { MOCK_DRAFT_TEAMS } from "@/data/mock-draft-teams";
import {
  isSlotBreathing,
  resolvePreviewPlayer,
  slotMotionState,
} from "@/lib/draft-preview";
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

describe("resolvePreviewPlayer", () => {
  const otherTeam = MOCK_DRAFT_TEAMS.find(
    (t) => t.teamSeasonId === "bulls-1996"
  );
  if (!otherTeam) throw new Error("missing fixture team bulls-1996");

  const jordan = otherTeam.players.find((p) => p.playerId === "michael-jordan");
  if (!jordan) throw new Error("missing fixture player michael-jordan");

  it("previews the hovered player when nothing is being dragged", () => {
    expect(resolvePreviewPlayer(offered, null, pierce)).toBe(pierce);
  });

  it("previews the dragged player when nothing is hovered", () => {
    expect(resolvePreviewPlayer(offered, rondo, null)).toBe(rondo);
  });

  it("previews nothing with an empty hand", () => {
    expect(resolvePreviewPlayer(offered, null, null)).toBeNull();
  });

  // Mid-drag the pointer is over the court, not the card, so a hover left
  // behind by the drag must never outrank the player actually in hand.
  it("lets a drag outrank a stale hover", () => {
    expect(resolvePreviewPlayer(offered, rondo, pierce)).toBe(rondo);
  });

  // The bug this function exists for: a card that unmounts under the pointer
  // never fires `pointerleave`, so drafting by click leaves a stale hover
  // behind. Drafting also clears the board, and a player off the board must
  // not keep the court reacting to him for the rest of the run.
  it("drops a hover left behind by the draft that cleared the board", () => {
    const drafted = reduce(
      reduce(offered, { type: "SELECT_SLOT", position: "SF" }),
      { type: "DRAFT_PLAYER", player: pierce, position: "SF" }
    );

    expect(drafted.offeredTeam).toBeNull();
    expect(resolvePreviewPlayer(drafted, null, pierce)).toBeNull();
  });

  it("drops a hover held over from the previous team on the board", () => {
    const rerolled = reduce(offered, { type: "REROLL", team: otherTeam });

    expect(resolvePreviewPlayer(rerolled, null, pierce)).toBeNull();
    expect(resolvePreviewPlayer(rerolled, null, jordan)).toBe(jordan);
  });

  // The staleness check has to cover the stronger of the two states as well —
  // a drag is not exempt from it just because it wins the ranking.
  it("checks a drag against the board too, not just a hover", () => {
    const rerolled = reduce(offered, { type: "REROLL", team: otherTeam });

    expect(resolvePreviewPlayer(rerolled, pierce, jordan)).toBeNull();
  });

  it("previews nothing before any team reaches the board", () => {
    expect(resolvePreviewPlayer(INITIAL_DRAFT_STATE, pierce, rondo)).toBeNull();
  });

  // The invariant the court depends on: `slotMotionState` runs the preview
  // through `validateDraft`, which would happily rule on a player who is not
  // on the board at all. Whatever comes back is always a player the board is
  // currently offering.
  it("only ever previews a player the board is currently offering", () => {
    const boards = [team, otherTeam];

    boards.forEach((board) => {
      const state = reduce(INITIAL_DRAFT_STATE, {
        type: "OFFER_TEAM",
        team: board,
      });
      const ids = new Set(board.players.map((p) => p.playerSeasonId));

      boards.forEach((source) => {
        source.players.forEach((player) => {
          [
            resolvePreviewPlayer(state, player, null),
            resolvePreviewPlayer(state, null, player),
          ].forEach((preview) => {
            if (preview === null) return;
            expect(ids.has(preview.playerSeasonId)).toBe(true);
          });
        });
      });
    });
  });
});

// The two halves of the pointer pipeline, checked together: separately they
// each pass while the court still misreads a stale pointer.
describe("resolvePreviewPlayer + slotMotionState", () => {
  const otherTeam = MOCK_DRAFT_TEAMS.find(
    (t) => t.teamSeasonId === "bulls-1996"
  );
  if (!otherTeam) throw new Error("missing fixture team bulls-1996");

  // The shipped bug, end to end: draft by click, so the card unmounts under
  // the pointer without firing `pointerleave`. The drafted player is now a
  // duplicate, so leaving him previewed makes every slot refuse him and the
  // court stops inviting anything for the rest of the run.
  it("keeps every open slot inviting under a hover the draft left behind", () => {
    const drafted = reduce(
      reduce(offered, { type: "SELECT_SLOT", position: "SF" }),
      { type: "DRAFT_PLAYER", player: pierce, position: "SF" }
    );
    const next = reduce(drafted, { type: "OFFER_TEAM", team: otherTeam });
    const open = slots.filter((position) => position !== "SF");
    const acceptsNext = (player: DraftablePlayer, position: Position) =>
      slotAcceptsPlayer(next, slots, player, position);

    const invitedWith = (previewPlayer: DraftablePlayer | null) =>
      open.filter(
        (position) =>
          slotMotionState({
            position,
            isFilled: false,
            isOpen: true,
            isSelected: false,
            previewPlayer,
            dragOver: null,
            accepts: acceptsNext,
          }).isInviting
      );

    expect(invitedWith(resolvePreviewPlayer(next, null, pierce))).toEqual(open);

    // Without the staleness check the preview survives as `pierce`, and this
    // is what the court then reads — so the assertion above is not vacuous.
    expect(invitedWith(pierce)).toEqual([]);
  });
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
