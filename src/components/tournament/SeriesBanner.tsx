"use client";

import React from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { DOT_ENTRANCE, entranceFrom, transitionFor } from "@/lib/motion";
import type { SeriesSideView } from "@/lib/tournament-view";

type Props = {
  first: SeriesSideView;
  second: SeriesSideView;
  gameNumber: number;
  hostCode: string;
  // Squad-anchored, unlike the sides — gold dots must count your wins from either slot.
  wins: { squad: number; opponent: number };
};

// The series so far, never the length of a finished one.
const Dots = ({ won, lost }: { won: number; lost: number }) => {
  // A transform must be refused explicitly — `MotionConfig` snaps rather than omits.
  const reduced = useReducedMotion() ?? false;

  return (
    <span className="flex items-center gap-1" aria-hidden="true">
      {/* `initial={false}` is what fires this at the buzzer and nowhere else. */}
      <AnimatePresence initial={false}>
        {Array.from({ length: won + lost }, (_, index) => (
          <motion.span
            key={index}
            initial={entranceFrom(true, reduced, DOT_ENTRANCE)}
            animate={{ opacity: 1, scale: 1 }}
            transition={transitionFor("spring", reduced)}
            className={`size-1.5 rounded-full ${
              index < won ? "bg-primary" : "bg-muted-foreground/50"
            }`}
          />
        ))}
      </AnimatePresence>
    </span>
  );
};

const SideLabel = ({ side }: { side: SeriesSideView }) => (
  <span
    className={`text-sm font-bold tracking-wide uppercase ${
      side.isSquad ? "text-primary" : "text-foreground"
    }`}
  >
    {side.name}
  </span>
);

const SeriesBanner = ({ first, second, gameNumber, hostCode, wins }: Props) => (
  <div className="border-border/70 bg-card/70 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 rounded-xl border px-4 py-3">
    <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
      <SideLabel side={first} />
      <span className="text-muted-foreground text-[0.625rem] font-semibold tracking-[0.18em]">
        VS
      </span>
      <SideLabel side={second} />
    </div>

    <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
      <span className="text-primary text-[0.6875rem] font-bold tracking-[0.18em]">
        GAME {gameNumber}
      </span>
      <span className="text-muted-foreground text-[0.625rem] font-semibold tracking-[0.14em]">
        AT {hostCode}
      </span>
      <span className="flex items-center gap-2">
        <span className="sr-only">
          Series {wins.squad}-{wins.opponent}
        </span>
        <Dots won={wins.squad} lost={wins.opponent} />
        <span className="text-muted-foreground text-[0.625rem] font-semibold">
          {wins.squad}-{wins.opponent}
        </span>
      </span>
    </div>
  </div>
);

export default SeriesBanner;
