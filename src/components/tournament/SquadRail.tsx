"use client";

import React from "react";
import { ChevronDown } from "lucide-react";
import PositionChip from "@/components/tournament/PositionChip";
import TeamCrest from "@/components/tournament/TeamCrest";
import { squadRatingOf } from "@/lib/run";
import { formatSeason } from "@/lib/format";
import {
  CONFERENCE_NAME,
  SQUAD_SHORT_CODE,
  squadDisplayName,
} from "@/lib/tournament-view";
import type { Conference, Squad, SquadMember } from "@/types/game";

type Props = {
  squad: Squad;
  conference: Conference;
};

const PlayerChip = ({ player }: { player: SquadMember }) => (
  <li className="border-border/70 bg-card/70 flex items-center gap-3 rounded-xl border px-3 py-2.5">
    <PositionChip position={player.position} size="md" />
    <div className="min-w-0 flex-1">
      <p className="text-foreground truncate text-sm font-semibold">
        {player.name}
      </p>
      <p className="text-muted-foreground truncate text-xs">
        {formatSeason(player.seasonYear)} {player.teamName}
      </p>
    </div>
    <span className="text-primary shrink-0 text-sm font-bold">
      {player.rating}
    </span>
  </li>
);

const SquadRail = ({ squad, conference }: Props) => {
  const [open, setOpen] = React.useState(false);
  const name = squadDisplayName(squad);
  const rating = squadRatingOf(squad);

  return (
    <section className="border-border/70 bg-card/60 rounded-2xl border px-4 py-4 sm:px-5">
      <div className="hidden items-center gap-3 md:flex">
        <TeamCrest code={SQUAD_SHORT_CODE} isSquad size="sm" />
        <div>
          <p className="text-primary text-lg font-bold tracking-wide uppercase">
            {name}
          </p>
          <p className="text-muted-foreground text-[0.625rem] font-semibold tracking-[0.16em]">
            {CONFERENCE_NAME[conference].toUpperCase()} CONFERENCE · AVG{" "}
            {rating}
          </p>
        </div>
      </div>

      <ul className="mt-4 hidden grid-cols-2 gap-3 md:grid lg:grid-cols-5">
        {squad.players.map((player) => (
          <PlayerChip key={player.playerSeasonId} player={player} />
        ))}
      </ul>

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        className="flex min-h-11 w-full items-center gap-3 text-left md:hidden"
      >
        <TeamCrest code={SQUAD_SHORT_CODE} isSquad />
        <span className="min-w-0 flex-1">
          <span className="text-primary block truncate text-sm font-bold tracking-wide uppercase">
            {name}
          </span>
          <span className="text-muted-foreground block text-[0.625rem] font-semibold tracking-[0.16em]">
            {conference} · AVG {rating}
          </span>
        </span>
        <ChevronDown
          className={`text-muted-foreground size-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <ul className="mt-4 flex flex-col gap-2 md:hidden">
          {squad.players.map((player) => (
            <PlayerChip key={player.playerSeasonId} player={player} />
          ))}
        </ul>
      )}
    </section>
  );
};

export default SquadRail;
