import { describe, expect, it } from "vitest";
import { TRADITIONAL_SLOTS } from "@/data/formations";
import { MOCK_DRAFT_TEAMS } from "@/data/mock-draft-teams";
import {
  canOfferTeam,
  canReroll,
  canSelectSlot,
  createDraftReducer,
  draftedPlayerSlugs,
  INITIAL_DRAFT_STATE,
  isDraftComplete,
  openPositions,
  playerAvailability,
  randomOtherSeason,
  randomOtherTeam,
  randomTeamSeason,
  TOTAL_REROLLS,
  validateDraft,
  type DraftState,
} from "@/lib/draft";
import type { DraftablePlayer, DraftTeam, Position } from "@/types/game";

const slots = TRADITIONAL_SLOTS;
const reduce = createDraftReducer(slots);

const teamOf = (teamSeasonId: string): DraftTeam => {
  const team = MOCK_DRAFT_TEAMS.find(
    (candidate) => candidate.teamSeasonId === teamSeasonId
  );
  if (!team) throw new Error(`missing fixture team ${teamSeasonId}`);
  return team;
};

const playerOf = (team: DraftTeam, playerId: string): DraftablePlayer => {
  const player = team.players.find(
    (candidate) => candidate.playerId === playerId
  );
  if (!player) throw new Error(`missing fixture player ${playerId}`);
  return player;
};

const offer = (state: DraftState, teamSeasonId: string) =>
  reduce(state, { type: "OFFER_TEAM", team: teamOf(teamSeasonId) });

const select = (state: DraftState, position: Position) =>
  reduce(state, { type: "SELECT_SLOT", position });

const draft = (state: DraftState, playerId: string, position: Position) => {
  if (!state.offeredTeam) throw new Error("no team offered");
  return reduce(state, {
    type: "DRAFT_PLAYER",
    player: playerOf(state.offeredTeam, playerId),
    position,
  });
};

// Drafts one player per slot, taking a fresh team each round.
const completeDraft = (): DraftState => {
  const picks: [string, string, Position][] = [
    ["bulls-1996", "michael-jordan", "SG"],
    ["celtics-1986", "larry-bird", "SF"],
    ["lakers-1987", "magic-johnson", "PG"],
    ["sixers-1983", "moses-malone", "C"],
    ["rockets-1995", "carl-herrera", "PF"],
  ];
  return picks.reduce((state, [teamSeasonId, playerId, position]) => {
    const offered = offer(state, teamSeasonId);
    return draft(select(offered, position), playerId, position);
  }, INITIAL_DRAFT_STATE);
};

describe("initial state", () => {
  it("starts empty with the full reroll pool", () => {
    expect(INITIAL_DRAFT_STATE.members).toHaveLength(0);
    expect(INITIAL_DRAFT_STATE.offeredTeam).toBeNull();
    expect(INITIAL_DRAFT_STATE.selectedPosition).toBeNull();
    expect(INITIAL_DRAFT_STATE.rerollsLeft).toBe(TOTAL_REROLLS);
    expect(TOTAL_REROLLS).toBe(3);
  });

  it("allows getting a team but not rerolling or selecting a slot", () => {
    expect(canOfferTeam(INITIAL_DRAFT_STATE, slots)).toBe(true);
    expect(canReroll(INITIAL_DRAFT_STATE, slots)).toBe(false);
    expect(canSelectSlot(INITIAL_DRAFT_STATE, slots, "PG")).toBe(false);
    expect(openPositions(INITIAL_DRAFT_STATE, slots)).toEqual([...slots]);
  });
});

describe("offering a team", () => {
  it("shows the roster and clears any previous slot selection", () => {
    const state = offer(INITIAL_DRAFT_STATE, "celtics-2008");
    expect(state.offeredTeam?.teamSeasonId).toBe("celtics-2008");
    expect(state.selectedPosition).toBeNull();
    expect(state.rerollsLeft).toBe(TOTAL_REROLLS);
  });

  it("is ignored while a team is already on the board", () => {
    const state = offer(INITIAL_DRAFT_STATE, "celtics-2008");
    expect(offer(state, "lakers-1987")).toBe(state);
  });

  it("is ignored once the lineup is complete", () => {
    const complete = completeDraft();
    expect(canOfferTeam(complete, slots)).toBe(false);
    expect(offer(complete, "celtics-2008")).toBe(complete);
  });
});

describe("slot selection", () => {
  it("only accepts open slots while a team is on the board", () => {
    const offered = offer(INITIAL_DRAFT_STATE, "celtics-2008");
    expect(canSelectSlot(offered, slots, "PG")).toBe(true);
    expect(select(offered, "PG").selectedPosition).toBe("PG");
  });

  it("keeps the same roster when switching slots mid-round", () => {
    const offered = offer(INITIAL_DRAFT_STATE, "celtics-2008");
    const switched = select(select(offered, "PG"), "SF");
    expect(switched.selectedPosition).toBe("SF");
    expect(switched.offeredTeam).toBe(offered.offeredTeam);
  });

  it("refuses a slot that already holds a player", () => {
    const drafted = draft(
      select(offer(INITIAL_DRAFT_STATE, "celtics-2008"), "PG"),
      "rajon-rondo",
      "PG"
    );
    const next = offer(drafted, "lakers-1987");
    expect(canSelectSlot(next, slots, "PG")).toBe(false);
    expect(select(next, "PG")).toBe(next);
  });
});

describe("drafting a player", () => {
  it("fills the slot, banks the team-season, and ends the round", () => {
    const state = draft(
      select(offer(INITIAL_DRAFT_STATE, "celtics-2008"), "SF"),
      "paul-pierce",
      "SF"
    );
    expect(state.members).toHaveLength(1);
    expect(state.members[0]).toMatchObject({
      playerSlug: "paul-pierce",
      position: "SF",
      seasonYear: 2008,
      teamSlug: "celtics",
    });
    // The next round does not start on its own.
    expect(state.offeredTeam).toBeNull();
    expect(state.selectedPosition).toBeNull();
    expect(canOfferTeam(state, slots)).toBe(true);
  });

  it("rejects a drop on a slot other than the selected one", () => {
    const ready = select(offer(INITIAL_DRAFT_STATE, "celtics-2008"), "SF");
    const player = playerOf(teamOf("celtics-2008"), "paul-pierce");
    expect(validateDraft(ready, slots, player, "PF")).toEqual({
      ok: false,
      reason: "WRONG_POSITION",
    });
    expect(
      reduce(ready, { type: "DRAFT_PLAYER", player, position: "PF" })
    ).toBe(ready);
  });

  it("rejects a player who does not cover the selected slot", () => {
    const ready = select(offer(INITIAL_DRAFT_STATE, "celtics-2008"), "C");
    const player = playerOf(teamOf("celtics-2008"), "rajon-rondo");
    expect(validateDraft(ready, slots, player, "C")).toEqual({
      ok: false,
      reason: "WRONG_POSITION",
    });
  });

  it("rejects a draft before a slot is selected", () => {
    const offered = offer(INITIAL_DRAFT_STATE, "celtics-2008");
    const player = playerOf(teamOf("celtics-2008"), "paul-pierce");
    expect(validateDraft(offered, slots, player, "SF")).toEqual({
      ok: false,
      reason: "NO_SLOT_SELECTED",
    });
  });

  it("blocks the same person from a different season", () => {
    const first = draft(
      select(offer(INITIAL_DRAFT_STATE, "heat-2013"), "SF"),
      "lebron-james",
      "SF"
    );
    const second = select(offer(first, "cavaliers-2016"), "PF");
    const otherSeason = playerOf(teamOf("cavaliers-2016"), "lebron-james");
    expect(otherSeason.playerSeasonId).not.toBe(
      first.members[0].playerSeasonId
    );
    expect(validateDraft(second, slots, otherSeason, "PF")).toEqual({
      ok: false,
      reason: "ALREADY_DRAFTED",
    });
    expect(draftedPlayerSlugs(first).has("lebron-james")).toBe(true);
  });

  it("stops at exactly five members, one per slot", () => {
    const complete = completeDraft();
    expect(complete.members).toHaveLength(slots.length);
    expect(complete.members.map((member) => member.position).sort()).toEqual(
      [...slots].sort()
    );
    expect(isDraftComplete(complete, slots)).toBe(true);
    expect(canReroll(complete, slots)).toBe(false);
    expect(canOfferTeam(complete, slots)).toBe(false);
  });
});

describe("player availability", () => {
  const offered = offer(INITIAL_DRAFT_STATE, "celtics-2008");
  const team = teamOf("celtics-2008");

  it("waits for a slot selection before anything is draftable", () => {
    expect(
      playerAvailability(offered, slots, playerOf(team, "paul-pierce"))
    ).toBe("AVAILABLE");
  });

  it("splits the roster by the selected slot", () => {
    const ready = select(offered, "SF");
    expect(
      playerAvailability(ready, slots, playerOf(team, "paul-pierce"))
    ).toBe("DRAFTABLE");
    expect(
      playerAvailability(ready, slots, playerOf(team, "rajon-rondo"))
    ).toBe("OFF_SLOT");
  });

  it("marks an already-drafted identity in a later round", () => {
    const first = draft(
      select(offer(INITIAL_DRAFT_STATE, "heat-2013"), "SF"),
      "lebron-james",
      "SF"
    );
    const next = offer(first, "cavaliers-2016");
    expect(
      playerAvailability(
        next,
        slots,
        playerOf(teamOf("cavaliers-2016"), "lebron-james")
      )
    ).toBe("ALREADY_DRAFTED");
  });

  it("marks a player whose position is already filled", () => {
    const first = draft(
      select(offer(INITIAL_DRAFT_STATE, "celtics-2008"), "PG"),
      "rajon-rondo",
      "PG"
    );
    const next = offer(first, "lakers-1987");
    expect(
      playerAvailability(
        next,
        slots,
        playerOf(teamOf("lakers-1987"), "magic-johnson")
      )
    ).toBe("OUT_OF_POSITION");
  });
});

describe("reroll pool", () => {
  const ready = select(offer(INITIAL_DRAFT_STATE, "celtics-2008"), "PG");

  it("unlocks as soon as a roster is on the board, with or without a slot", () => {
    expect(canReroll(INITIAL_DRAFT_STATE, slots)).toBe(false);
    expect(canReroll(offer(INITIAL_DRAFT_STATE, "celtics-2008"), slots)).toBe(
      true
    );
    expect(canReroll(ready, slots)).toBe(true);
  });

  it("can be spent before any slot is selected", () => {
    const offered = offer(INITIAL_DRAFT_STATE, "celtics-2008");
    const rerolled = reduce(offered, {
      type: "REROLL",
      team: teamOf("lakers-1987"),
    });
    expect(rerolled.rerollsLeft).toBe(TOTAL_REROLLS - 1);
    expect(rerolled.offeredTeam?.teamSeasonId).toBe("lakers-1987");
    expect(rerolled.selectedPosition).toBeNull();
  });

  it("spends one right per use and keeps the selected slot", () => {
    const rerolled = reduce(ready, {
      type: "REROLL",
      team: teamOf("lakers-1987"),
    });
    expect(rerolled.rerollsLeft).toBe(TOTAL_REROLLS - 1);
    expect(rerolled.offeredTeam?.teamSeasonId).toBe("lakers-1987");
    expect(rerolled.selectedPosition).toBe("PG");
  });

  it("shares one pool of three across every reroll button", () => {
    const spend = (state: DraftState, teamSeasonId: string) =>
      reduce(state, { type: "REROLL", team: teamOf(teamSeasonId) });

    const spent = spend(
      spend(spend(ready, "lakers-1987"), "lakers-2001"),
      "bulls-1996"
    );
    expect(spent.rerollsLeft).toBe(0);
    expect(canReroll(spent, slots)).toBe(false);
    expect(spend(spent, "heat-2013")).toBe(spent);
  });
});

describe("random team selection", () => {
  const firstRng = () => 0;
  const lastRng = () => 0.999;

  it("picks from the whole pool", () => {
    expect(randomTeamSeason(MOCK_DRAFT_TEAMS, firstRng)).toBe(
      MOCK_DRAFT_TEAMS[0]
    );
    expect(randomTeamSeason(MOCK_DRAFT_TEAMS, lastRng)).toBe(
      MOCK_DRAFT_TEAMS[MOCK_DRAFT_TEAMS.length - 1]
    );
    expect(randomTeamSeason([], firstRng)).toBeNull();
  });

  it("another team never returns the same franchise", () => {
    for (const current of MOCK_DRAFT_TEAMS) {
      for (const rng of [firstRng, lastRng, () => 0.5]) {
        const next = randomOtherTeam(MOCK_DRAFT_TEAMS, current, rng);
        expect(next, current.teamSeasonId).not.toBeNull();
        expect(next?.teamSlug, current.teamSeasonId).not.toBe(current.teamSlug);
      }
    }
  });

  it("another season keeps the franchise and changes the year", () => {
    for (const current of MOCK_DRAFT_TEAMS) {
      for (const rng of [firstRng, lastRng]) {
        const next = randomOtherSeason(MOCK_DRAFT_TEAMS, current, rng);
        expect(next, current.teamSeasonId).not.toBeNull();
        expect(next?.teamSlug).toBe(current.teamSlug);
        expect(next?.seasonYear, current.teamSeasonId).not.toBe(
          current.seasonYear
        );
      }
    }
  });

  it("reports when a franchise has no other season", () => {
    const only = MOCK_DRAFT_TEAMS[0];
    expect(randomOtherSeason([only], only, firstRng)).toBeNull();
  });
});
