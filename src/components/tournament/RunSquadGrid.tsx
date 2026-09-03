"use client";

import React from "react";
import { motion, useReducedMotion } from "motion/react";
import { formatSeason } from "@/lib/format";
import { FADE_RISE, entranceFrom, sequencedTransition } from "@/lib/motion";
import { POSITION_SOFT_BG, POSITION_TEXT } from "@/lib/position-style";
import type { SquadMember } from "@/types/game";

type Props = {
  players: readonly SquadMember[];
  section: number;
};

const RunSquadGrid = ({ players, section }: Props) => {
  const reduced = useReducedMotion() ?? false;

  return (
    <section className="border-border/70 bg-card/60 rounded-2xl border px-4 py-4 sm:px-5 sm:py-5">
      <h2 className="text-muted-foreground text-[0.625rem] font-semibold tracking-[0.18em]">
        THE FIVE
      </h2>

      <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {/* `orderMembersBySlots` already put these in slot order, so following
            the render order is what makes this PG→C rather than draft order.
            The same cap covers 390's vertical cascade and 1440's sweep. */}
        {players.map((player, index) => (
          <motion.li
            key={player.playerSeasonId}
            initial={entranceFrom(true, reduced, FADE_RISE.initial)}
            animate={FADE_RISE.animate}
            transition={sequencedTransition("base", section, index, {
              reduced,
            })}
            className="border-border/60 bg-card flex flex-col gap-2 rounded-xl border px-3 py-3"
          >
            <span
              className={`flex size-7 items-center justify-center rounded-full text-[0.625rem] font-bold ${POSITION_SOFT_BG[player.position]} ${POSITION_TEXT[player.position]}`}
            >
              {player.position}
            </span>
            <div>
              <p className="text-foreground text-sm font-semibold break-words">
                {player.name}
              </p>
              <p className="text-muted-foreground text-xs break-words">
                {formatSeason(player.seasonYear)} {player.teamName}
              </p>
            </div>
            <p className="text-primary text-xl font-bold tabular-nums">
              {player.rating}
            </p>
          </motion.li>
        ))}
      </ul>
    </section>
  );
};

export default RunSquadGrid;
