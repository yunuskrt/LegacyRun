import type { PlayoffRound } from "@/generated/prisma/client";
import type { Conference } from "@/types/game";

export type { PlayoffRound };

// Carries no team rating on purpose — difficulty comes from `pedigree`.
export type BracketOpponent = {
  teamSeasonId: string;
  teamSlug: string;
  teamName: string;
  teamLogo: string;
  seasonYear: number;
  conference: Conference;
  seed: number;
  roundReached: PlayoffRound;
  wins: number;
  losses: number;
  pedigree: number;
};

export type BracketSlot =
  | { side: "SQUAD"; bracketSlot: number }
  | {
      side: "OPPONENT";
      bracketSlot: number | null;
      opponent: BracketOpponent;
    };

export type BracketRoundId =
  "FIRST_ROUND" | "CONFERENCE_SEMIS" | "CONFERENCE_FINALS" | "NBA_FINALS";

export type BracketMatchup = {
  id: string;
  round: BracketRoundId;
  home: BracketSlot | null;
  away: BracketSlot | null;
  winner: BracketSlot | null;
};

export type BracketRound = {
  id: BracketRoundId;
  label: string;
  matchups: BracketMatchup[];
};

export type Bracket = {
  runSeed: string;
  conference: Conference;
  squadSlot: number;
  rounds: BracketRound[];
};
