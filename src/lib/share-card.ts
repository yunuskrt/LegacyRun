import { z } from "zod";
import { TRADITIONAL_SLOTS } from "@/data/formations";
import { MAX_SQUAD_NAME_LENGTH, squadRatingOf } from "@/lib/run";
import { playoffRecord, runPath } from "@/lib/run-summary";
import { TEAM_SLUG_PATTERN } from "@/lib/team-logo";
import { ROUND_PHRASE, squadDisplayName } from "@/lib/tournament-view";
import { SQUAD_SIZE } from "@/types/game";
import type { Bracket, BracketRoundId } from "@/types/bracket";
import type { Position, Squad } from "@/types/game";
import type { SeriesState } from "@/types/match";

export const SHARE_CARD_PATH = "/api/share/card";

// Bumped only when the wire shape changes; an older link then fails validation
// rather than rendering against the wrong field names.
export const SHARE_CARD_VERSION = 1;

export type ShareCardRatio = "STORY" | "TALL" | "FEED";

export type ShareCardSize = {
  width: number;
  height: number;
  label: string;
};

// All three are vertical — only how tall varies, so one layout serves them all.
export const SHARE_CARD_SIZES: Record<ShareCardRatio, ShareCardSize> = {
  STORY: { width: 1080, height: 1920, label: "9:16" },
  TALL: { width: 1080, height: 1440, label: "3:4" },
  FEED: { width: 1080, height: 1350, label: "4:5" },
};

export const SHARE_CARD_RATIOS: readonly ShareCardRatio[] = [
  "STORY",
  "TALL",
  "FEED",
];

export const DEFAULT_SHARE_RATIO: ShareCardRatio = "FEED";

// Mirrors Tailwind's `sm` and `lg`, so the offered shape matches the device.
export const ratioForViewport = (width: number): ShareCardRatio =>
  width < 640 ? "STORY" : width < 1024 ? "TALL" : "FEED";

export type ShareCardPlayer = {
  pos: Position;
  name: string;
  team: string;
  slug: string;
  year: number;
  rating: number;
};

// The side of the last decided series — beaten in the Finals, or the one that won.
export type ShareCardFinale = {
  team: string;
  year: number;
  round: BracketRoundId;
};

export type ShareCard = {
  v: number;
  champion: boolean;
  name: string;
  avg: number;
  wins: number;
  losses: number;
  last: ShareCardFinale | null;
  five: ShareCardPlayer[];
};

// A run is at most four rounds of seven.
const MAX_RUN_GAMES = 28;

const MAX_RATING = 100;

// The draft pool opens in 1980; the ceiling is slack, not a data bound.
const MIN_SEASON = 1980;
const MAX_SEASON = 2100;

// Defined beside the path convention it has to stay safe for.
const slugSchema = z.string().regex(TEAM_SLUG_PATTERN);

const playerSchema = z.object({
  pos: z.enum(TRADITIONAL_SLOTS),
  name: z.string().min(1).max(60),
  team: z.string().min(1).max(40),
  slug: slugSchema,
  year: z.int().min(MIN_SEASON).max(MAX_SEASON),
  rating: z.int().min(0).max(MAX_RATING),
});

// `z.enum` needs a tuple, which `ROUND_ORDER` is not; `share-card.test.ts` pins
// this restatement against it so the two cannot drift.
export const ROUND_IDS = [
  "FIRST_ROUND",
  "CONFERENCE_SEMIS",
  "CONFERENCE_FINALS",
  "NBA_FINALS",
] as const satisfies readonly BracketRoundId[];

const finaleSchema = z.object({
  team: z.string().min(1).max(40),
  year: z.int().min(MIN_SEASON).max(MAX_SEASON),
  round: z.enum(ROUND_IDS),
});

const shareCardSchema = z.object({
  v: z.literal(SHARE_CARD_VERSION),
  champion: z.boolean(),
  name: z.string().min(1).max(MAX_SQUAD_NAME_LENGTH),
  avg: z.int().min(0).max(MAX_RATING),
  wins: z.int().min(0).max(MAX_RUN_GAMES),
  losses: z.int().min(0).max(MAX_RUN_GAMES),
  last: finaleSchema.nullable(),
  five: z.array(playerSchema).length(SQUAD_SIZE),
});

export const buildShareCard = (
  squad: Squad,
  bracket: Bracket,
  series: readonly SeriesState[],
  isChampion: boolean
): ShareCard => {
  const path = runPath(bracket, series);
  const record = playoffRecord(path);
  // The path stops at the loss, so its last row is the finale either way.
  const last = path.at(-1) ?? null;

  return {
    v: SHARE_CARD_VERSION,
    champion: isChampion,
    name: squadDisplayName(squad),
    avg: squadRatingOf(squad),
    wins: record.wins,
    losses: record.losses,
    last: last?.opponent
      ? {
          team: last.opponent.teamName,
          year: last.opponent.seasonYear,
          round: last.round,
        }
      : null,
    five: squad.players.map((player) => ({
      pos: player.position,
      name: player.name,
      team: player.teamName,
      slug: player.teamSlug,
      year: player.seasonYear,
      rating: player.rating,
    })),
  };
};

export const outcomeBanner = (champion: boolean): string =>
  champion ? "CHAMPION" : "ELIMINATED";

// From ROUND_PHRASE, which already carries each round's article — "Round 1" takes none.
export const closingLine = ({ champion, last }: ShareCard): string => {
  if (!last) return champion ? "Won it all" : "The run is over";

  const opponent = `the ${last.year} ${last.team}`;
  const round = ROUND_PHRASE[last.round];

  return champion
    ? `Beat ${opponent} in ${round}`
    : `Eliminated by ${opponent} in ${round}`;
};

export const recordLine = ({ wins, losses }: ShareCard): string =>
  `${wins}-${losses}`;

// `btoa` rejects any code point above U+00FF, and names like Dončić carry them.
const toBase64Url = (bytes: Uint8Array): string => {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
};

const fromBase64Url = (value: string): Uint8Array => {
  const binary = atob(value.replace(/-/g, "+").replace(/_/g, "/"));

  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
};

export const encodeShareCard = (card: ShareCard): string =>
  toBase64Url(new TextEncoder().encode(JSON.stringify(card)));

// A real payload runs to roughly 1100 characters. The ceiling exists so the
// pathological ones are rejected before `atob` and `JSON.parse` see them.
export const MAX_ENCODED_CARD_LENGTH = 2048;

// Every failure mode — bad base64, bad JSON, a tampered field — lands on `null`.
export const decodeShareCard = (encoded: string): ShareCard | null => {
  if (encoded.length === 0 || encoded.length > MAX_ENCODED_CARD_LENGTH) {
    return null;
  }

  try {
    const json = new TextDecoder().decode(fromBase64Url(encoded));
    const parsed = shareCardSchema.safeParse(JSON.parse(json));

    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
};

export const parseShareRatio = (value: string | null): ShareCardRatio =>
  SHARE_CARD_RATIOS.includes(value as ShareCardRatio)
    ? (value as ShareCardRatio)
    : DEFAULT_SHARE_RATIO;

// base64url needs no percent-encoding, so the query is safe to build by hand.
export const shareCardPath = (card: ShareCard, ratio: ShareCardRatio): string =>
  `${SHARE_CARD_PATH}?ratio=${ratio}&d=${encodeShareCard(card)}`;

// One fixed name for every run, rather than one built from the squad and outcome.
export const SHARE_CARD_FILE_NAME = "legacyrun-result.png";
