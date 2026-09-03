import type {
  Conference,
  Position,
  Run,
  Squad,
  SquadMember,
} from "@/types/game";

export const MAX_SQUAD_NAME_LENGTH = 40;

export const normalizeSquadName = (raw: string): string | undefined => {
  const trimmed = raw.trim().slice(0, MAX_SQUAD_NAME_LENGTH);
  return trimmed.length > 0 ? trimmed : undefined;
};

// The draft fills slots in whatever order the player picks; the squad reads in
// formation order.
export const orderMembersBySlots = (
  members: readonly SquadMember[],
  slots: readonly Position[]
): SquadMember[] => {
  const remaining = [...members];
  const ordered: SquadMember[] = [];

  for (const slot of slots) {
    const index = remaining.findIndex((member) => member.position === slot);
    if (index !== -1) ordered.push(...remaining.splice(index, 1));
  }

  return [...ordered, ...remaining];
};

// The squad's one strength number — it seeds the bracket and labels the face-off.
export const squadRatingOf = (squad: Squad): number =>
  squad.players.length === 0
    ? 0
    : Math.round(
        squad.players.reduce((total, player) => total + player.rating, 0) /
          squad.players.length
      );

export const buildRun = (
  members: readonly SquadMember[],
  slots: readonly Position[],
  name: string,
  conference: Conference
): Run => ({
  squad: {
    name: normalizeSquadName(name),
    formation: "TRADITIONAL",
    players: orderMembersBySlots(members, slots),
  },
  conference,
});
