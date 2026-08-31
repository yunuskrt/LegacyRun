import React from "react";
import type { MomentumPoint } from "@/lib/replay";
import type { SeriesSideView } from "@/lib/tournament-view";

type Props = {
  points: MomentumPoint[];
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

const MomentumStrip = ({ points, margin, home, away }: Props) => {
  const leader = margin === 0 ? null : margin > 0 ? home : away;
  const span = Math.max(
    MIN_SCALE,
    ...points.map((point) => Math.abs(point.margin))
  );
  const lastX = points[points.length - 1]?.x || 1;

  const coords = points.map((point) => {
    const x = (point.x / lastX) * VIEW_WIDTH;
    const y = VIEW_HEIGHT / 2 - (point.margin / span) * AMPLITUDE;

    return `${x.toFixed(2)},${y.toFixed(2)}`;
  });

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

      <svg
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        preserveAspectRatio="none"
        className="mt-3 h-24 w-full"
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
          <>
            <polygon
              points={`0,${VIEW_HEIGHT / 2} ${coords.join(" ")} ${(
                (points[points.length - 1].x / lastX) *
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
          </>
        )}
      </svg>

      <p className="sr-only">
        {leader ? `${leader.name} lead by ${Math.abs(margin)}` : "Scores level"}
      </p>
    </div>
  );
};

export default MomentumStrip;
