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
// The widest margin would otherwise land exactly on the viewBox edge and have
// half its stroke clipped away.
const AMPLITUDE = VIEW_HEIGHT / 2 - 2;

const MomentumStrip = ({ points, axisEnd, margin, home, away }: Props) => {
  const reduced = useReducedMotion() ?? false;
  const leader = margin === 0 ? null : margin > 0 ? home : away;
  const span = Math.max(
    MIN_SCALE,
    ...points.map((point) => Math.abs(point.margin))
  );

  // Coordinates are always plotted against regulation and the whole curve is
  // scaled to the live axis, so an overtime compresses it in one transition
  // instead of every point jumping to a new place at once.
  const scaleX = REGULATION_SECONDS / axisEnd;

  const coords = points.map((point) => {
    const x = (point.x / REGULATION_SECONDS) * VIEW_WIDTH;
    const y = VIEW_HEIGHT / 2 - (point.margin / span) * AMPLITUDE;

    return `${x.toFixed(2)},${y.toFixed(2)}`;
  });

  // `momentumSeries` always opens at the tip-off point, so this is never empty
  // in practice — but the prop type allows it and the old normalization guarded
  // for it, so keep the guard rather than quietly dropping it.
  const tip = points[points.length - 1] ?? { x: 0, margin: 0 };
  const tipLeft = ((tip.x / REGULATION_SECONDS) * scaleX * VIEW_WIDTH).toFixed(
    2
  );
  // The same margin the stroke gets: a dot centred on the viewBox edge would
  // lose half of itself in exactly the way Phase 17's widest margin did.
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
              {/* The fill has no animation of its own — two animated shapes
                  tracking each other visibly disagree for a frame. */}
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

        {/* "Here is now" — an HTML dot rather than an SVG circle, which the
            stretched viewBox would render as an ellipse. */}
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
