import type { Conference, Position } from "@/generated/prisma/client";

export type { Conference, Position };

export type FormationId = "TRADITIONAL";

export const SQUAD_SIZE = 5;

export type DraftablePlayer = {
  playerId: string;
  playerSeasonId: string;
  name: string;
  age: number;
  position: Position;
  rating: number;
};

// `teamLogo` is derived from the slug at read time, never stored in the database.
export type DraftTeam = {
  teamSeasonId: string;
  teamName: string;
  teamSlug: string;
  teamLogo: string;
  teamRating: number;
  seasonYear: number;
  players: DraftablePlayer[];
};

export type SquadMember = {
  playerSlug: string;
  playerSeasonId: string;
  name: string;
  teamName: string;
  teamSlug: string;
  teamLogo: string;
  seasonYear: number;
  position: Position;
  rating: number;
};

export type Squad = {
  name?: string;
  formation: FormationId;
  rating?: number;
  players: SquadMember[];
};

// Runtime state only — nothing about a run is persisted.
export type Run = {
  squad: Squad;
  conference: Conference;
};
