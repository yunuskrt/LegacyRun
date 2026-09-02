import type {
  DraftablePlayer,
  DraftTeam,
  Position,
  SquadMember,
} from "@/types/game";

export const TOTAL_REROLLS = 3;

// Drag payload is the player-season id. `text/plain` rather than a custom MIME
// type, which Safari drops on drop.
export const PLAYER_DRAG_TYPE = "text/plain";

// The three reroll buttons draw on one shared pool — hard constraint 7.
export type RerollKind = "ANOTHER_TEAM" | "ANOTHER_SEASON" | "SKIP_ROUND";

export type DraftState = {
  members: SquadMember[];
  offeredTeam: DraftTeam | null;
  selectedPosition: Position | null;
  rerollsLeft: number;
};

export type DraftAction =
  | { type: "OFFER_TEAM"; team: DraftTeam }
  | { type: "REROLL"; team: DraftTeam }
  | { type: "SELECT_SLOT"; position: Position }
  | { type: "DRAFT_PLAYER"; player: DraftablePlayer; position: Position };

export type DraftRejection =
  | "NO_TEAM_OFFERED"
  | "NO_SLOT_SELECTED"
  | "SLOT_FILLED"
  | "WRONG_POSITION"
  | "ALREADY_DRAFTED";

export type DraftAttempt = { ok: true } | { ok: false; reason: DraftRejection };

// How a roster card reads for the current state: only DRAFTABLE can be picked,
// AVAILABLE is waiting on a slot selection, the rest are dead ends this round.
export type PlayerAvailability =
  | "DRAFTABLE"
  | "AVAILABLE"
  | "OFF_SLOT"
  | "OUT_OF_POSITION"
  | "ALREADY_DRAFTED";

export const INITIAL_DRAFT_STATE: DraftState = {
  members: [],
  offeredTeam: null,
  selectedPosition: null,
  rerollsLeft: TOTAL_REROLLS,
};

export const draftedPlayerSlugs = (state: DraftState): Set<string> =>
  new Set(state.members.map((member) => member.playerSlug));

export const openPositions = (
  state: DraftState,
  slots: readonly Position[]
): Position[] => {
  const filled = new Set(state.members.map((member) => member.position));
  return slots.filter((position) => !filled.has(position));
};

export const isDraftComplete = (
  state: DraftState,
  slots: readonly Position[]
): boolean => openPositions(state, slots).length === 0;

export const canOfferTeam = (
  state: DraftState,
  slots: readonly Position[]
): boolean => !isDraftComplete(state, slots) && state.offeredTeam === null;

// A roster on the board is enough — rerolling does not require a slot selection.
export const canReroll = (
  state: DraftState,
  slots: readonly Position[]
): boolean =>
  !isDraftComplete(state, slots) &&
  state.offeredTeam !== null &&
  state.rerollsLeft > 0;

export const canSelectSlot = (
  state: DraftState,
  slots: readonly Position[],
  position: Position
): boolean =>
  state.offeredTeam !== null && openPositions(state, slots).includes(position);

export const validateDraft = (
  state: DraftState,
  slots: readonly Position[],
  player: DraftablePlayer,
  position: Position
): DraftAttempt => {
  if (!state.offeredTeam) return { ok: false, reason: "NO_TEAM_OFFERED" };
  if (!state.selectedPosition) return { ok: false, reason: "NO_SLOT_SELECTED" };
  // Hard constraint 6 — one appearance per person per run, any season. Checked
  // ahead of the slot rules so the identity block is what the player is told,
  // matching the order `playerAvailability` reports.
  if (draftedPlayerSlugs(state).has(player.playerId))
    return { ok: false, reason: "ALREADY_DRAFTED" };
  if (!openPositions(state, slots).includes(position))
    return { ok: false, reason: "SLOT_FILLED" };
  if (position !== state.selectedPosition)
    return { ok: false, reason: "WRONG_POSITION" };
  if (player.position !== position)
    return { ok: false, reason: "WRONG_POSITION" };
  return { ok: true };
};

// Would this slot take this player, if it were the selected one? Asked by the
// court to decide which slots invite a hovered or dragged card. Derived from
// `validateDraft` rather than restating its rules — a second copy that drifts
// would light up a slot the reducer then rejects.
export const slotAcceptsPlayer = (
  state: DraftState,
  slots: readonly Position[],
  player: DraftablePlayer,
  position: Position
): boolean =>
  validateDraft(
    { ...state, selectedPosition: position },
    slots,
    player,
    position
  ).ok;

export const playerAvailability = (
  state: DraftState,
  slots: readonly Position[],
  player: DraftablePlayer
): PlayerAvailability => {
  if (draftedPlayerSlugs(state).has(player.playerId)) return "ALREADY_DRAFTED";

  if (!openPositions(state, slots).includes(player.position))
    return "OUT_OF_POSITION";

  if (!state.selectedPosition) return "AVAILABLE";
  return player.position === state.selectedPosition ? "DRAFTABLE" : "OFF_SLOT";
};

export const toSquadMember = (
  player: DraftablePlayer,
  team: DraftTeam,
  position: Position
): SquadMember => ({
  playerSlug: player.playerId,
  playerSeasonId: player.playerSeasonId,
  name: player.name,
  teamName: team.teamName,
  teamSlug: team.teamSlug,
  teamLogo: team.teamLogo,
  seasonYear: team.seasonYear,
  position,
  rating: player.rating,
});

export const createDraftReducer =
  (slots: readonly Position[]) =>
  (state: DraftState, action: DraftAction): DraftState => {
    switch (action.type) {
      case "OFFER_TEAM":
        if (!canOfferTeam(state, slots)) return state;
        return { ...state, offeredTeam: action.team, selectedPosition: null };

      case "REROLL":
        if (!canReroll(state, slots)) return state;
        return {
          ...state,
          offeredTeam: action.team,
          rerollsLeft: state.rerollsLeft - 1,
        };

      case "SELECT_SLOT":
        if (!canSelectSlot(state, slots, action.position)) return state;
        return { ...state, selectedPosition: action.position };

      case "DRAFT_PLAYER": {
        if (!state.offeredTeam) return state;
        const attempt = validateDraft(
          state,
          slots,
          action.player,
          action.position
        );
        if (!attempt.ok) return state;
        return {
          ...state,
          members: [
            ...state.members,
            toSquadMember(action.player, state.offeredTeam, action.position),
          ],
          offeredTeam: null,
          selectedPosition: null,
        };
      }
    }
  };
