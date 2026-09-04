"use client";

import React from "react";
import { motion, useReducedMotion } from "motion/react";
import { transitionFor } from "@/lib/motion";
import { REGULATION_SECONDS } from "@/lib/replay";
import type { MomentumPoint } from "@/lib/replay";
import type { SeriesSideView } from "@/lib/tournament-view";

type Props = {
  points: MomentumPoint[];
  axisEnd: number;
  margin: number;
  home: SeriesSideView;
  away: SeriesSideView;
};

const VIEW_WIDTH = 100;
const VIEW_HEIGHT = 40;
const MIN_SCALE = 8;
// Without it the widest margin lands on the viewBox edge and loses half its stroke.
const AMPLITUDE = VIEW_HEIGHT / 2 - 2;

const MomentumStrip = ({ points, axisEnd, margin, home, away }: Props) => {
  const reduced = useReducedMotion() ?? false;
  const leader = margin === 0 ? null : margin > 0 ? home : away;
  const span = Math.max(
    MIN_SCALE,
    ...points.map((point) => Math.abs(point.margin))
  );

  // Plotted against regulation and scaled, so an overtime compresses it in one transition.
  const scaleX = REGULATION_SECONDS / axisEnd;

  const coords = points.map((point) => {
    const x = (point.x / REGULATION_SECONDS) * VIEW_WIDTH;
    const y = VIEW_HEIGHT / 2 - (point.margin / span) * AMPLITUDE;

    return `${x.toFixed(2)},${y.toFixed(2)}`;
  });

  // Never empty in practice, but the prop type allows it — keep the guard.
  const tip = points[points.length - 1] ?? { x: 0, margin: 0 };
  const tipLeft = ((tip.x / REGULATION_SECONDS) * scaleX * VIEW_WIDTH).toFixed(
    2
  );
  // The same margin the stroke gets, for the same clipping reason.
  const tipTop = (
    ((VIEW_HEIGHT / 2 - (tip.margin / span) * AMPLITUDE) / VIEW_HEIGHT) *
    100
  ).toFixed(2);

  return (
    <div className="bg-card shadow-panel rounded-2xl px-4 py-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-muted-foreground text-[0.625rem] font-semibold tracking-[0.18em]">
          MOMENTUM · SCORE MARGIN
        </p>
        <p className="text-primary text-[0.6875rem] font-bold tracking-[0.14em]">
          {leader ? `${leader.code} +${Math.abs(margin)}` : "TIED"}
        </p>
      </div>

      <div className="relative mt-3 h-24 w-full">
        <svg
          viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
          preserveAspectRatio="none"
          className="h-full w-full"
          aria-hidden="true"
        >
          <line
            x1="0"
            y1={VIEW_HEIGHT / 2}
            x2={VIEW_WIDTH}
            y2={VIEW_HEIGHT / 2}
            className="stroke-border"
            strokeWidth="0.4"
          />
          {coords.length > 1 && (
            <motion.g
              animate={{ scaleX }}
              transition={transitionFor("base", reduced)}
              style={{ transformBox: "view-box", transformOrigin: "0 0" }}
            >
              {/* Unanimated — two shapes tracking each other disagree for a frame. */}
              <polygon
                points={`0,${VIEW_HEIGHT / 2} ${coords.join(" ")} ${(
                  (tip.x / REGULATION_SECONDS) *
                  VIEW_WIDTH
                ).toFixed(2)},${VIEW_HEIGHT / 2}`}
                className="fill-primary/15"
              />
              <polyline
                points={coords.join(" ")}
                fill="none"
                className="stroke-primary"
                strokeWidth="0.7"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            </motion.g>
          )}
        </svg>

        {/* An HTML dot, not an SVG circle — the stretched viewBox would ellipse it. */}
        <motion.span
          className="bg-primary absolute size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
          animate={{ left: `${tipLeft}%`, top: `${tipTop}%` }}
          transition={transitionFor("base", reduced)}
          aria-hidden="true"
        />
      </div>

      <p className="sr-only">
        {leader ? `${leader.name} lead by ${Math.abs(margin)}` : "Scores level"}
      </p>
    </div>
  );
};

export default MomentumStrip;
