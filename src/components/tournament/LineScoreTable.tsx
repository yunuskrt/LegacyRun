import React from "react";
import { periodLabel } from "@/lib/replay";
import { bySide } from "@/lib/tournament-view";
import type { LineScoreCell } from "@/lib/replay";
import type { SeriesSideView, SidePair } from "@/lib/tournament-view";

type Props = {
  cells: LineScoreCell[];
  first: SeriesSideView;
  second: SeriesSideView;
  scores: SidePair<number>;
};

const LineScoreTable = ({ cells, first, second, scores }: Props) => {
  const row = (side: SeriesSideView) => (
    <tr className="border-border/50 border-t">
      <th
        scope="row"
        className={`px-2 py-2 text-left text-xs font-bold tracking-[0.1em] sm:px-4 ${
          side.isSquad ? "text-primary" : "text-foreground"
        }`}
      >
        {side.code}
      </th>
      {cells.map((cell) => {
        const value = bySide(cell, side.id);

        return (
          <td
            key={cell.period}
            className={`px-2 py-2 text-center text-sm tabular-nums sm:px-4 ${
              cell.isCurrent
                ? "bg-primary/10 text-primary font-semibold"
                : "text-foreground"
            }`}
          >
            {value ?? "–"}
          </td>
        );
      })}
      <td className="text-foreground px-2 py-2 text-center text-sm font-bold tabular-nums sm:px-4">
        {bySide(scores, side.id)}
      </td>
    </tr>
  );

  return (
    <div className="bg-card shadow-panel rounded-2xl">
      <p className="text-muted-foreground px-4 pt-3 pb-2 text-[0.625rem] font-semibold tracking-[0.18em]">
        LINE SCORE
      </p>
      {/* No min-width floor: regulation fits 375px, and overtime columns still scroll here rather than clipping the total. */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-muted-foreground text-[0.625rem] font-semibold tracking-[0.14em]">
              <th scope="col" className="px-2 pb-2 text-left sm:px-4">
                TEAM
              </th>
              {cells.map((cell) => (
                <th
                  key={cell.period}
                  scope="col"
                  className={`px-2 pb-2 text-center sm:px-4 ${
                    cell.isCurrent ? "text-primary" : ""
                  }`}
                >
                  {periodLabel(cell.period)}
                </th>
              ))}
              <th scope="col" className="px-2 pb-2 text-center sm:px-4">
                T
              </th>
            </tr>
          </thead>
          <tbody>
            {row(first)}
            {row(second)}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LineScoreTable;
