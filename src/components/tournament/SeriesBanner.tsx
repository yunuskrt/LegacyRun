"use client";

import React from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { entranceFrom, transitionFor } from "@/lib/motion";
import type { SeriesSideView } from "@/lib/tournament-view";

type Props = {
  home: SeriesSideView;
  away: SeriesSideView;
  gameNumber: number;
  hostCode: string;
  wins: { home: number; away: number };
};

const DOT_ENTRANCE = { opacity: 0, scale: 0.6 };

// One dot per game already played, filled for the home side's wins. The count
// is the series so far, never the length of a finished series.
const Dots = ({ won, lost }: { won: number; lost: number }) => {
  // The dot scales in, and a transform target has to be refused explicitly —
  // `MotionConfig` snaps one rather than omitting it.
  const reduced = useReducedMotion() ?? false;

  return (
    <span className="flex items-center gap-1" aria-hidden="true">
      {/* `initial={false}` is what makes this fire at the buzzer and nowhere else:
        the games already played are on screen from the first frame, so only the
        dot the final score adds animates in. */}
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

const SeriesBanner = ({ home, away, gameNumber, hostCode, wins }: Props) => (
  <div className="border-border/70 bg-card/70 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 rounded-xl border px-4 py-3">
    <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
      <SideLabel side={home} />
      <span className="text-muted-foreground text-[0.625rem] font-semibold tracking-[0.18em]">
        VS
      </span>
      <SideLabel side={away} />
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
          Series {wins.home}-{wins.away}
        </span>
        <Dots won={wins.home} lost={wins.away} />
        <span className="text-muted-foreground text-[0.625rem] font-semibold">
          {wins.home}-{wins.away}
        </span>
      </span>
    </div>
  </div>
);

export default SeriesBanner;
