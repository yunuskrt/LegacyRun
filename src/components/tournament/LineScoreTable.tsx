import React from "react";
import { periodLabel } from "@/lib/replay";
import type { LineScoreCell } from "@/lib/replay";
import type { SeriesSideView } from "@/lib/tournament-view";

type Props = {
  cells: LineScoreCell[];
  home: SeriesSideView;
  away: SeriesSideView;
  homeScore: number;
  awayScore: number;
};

const LineScoreTable = ({ cells, home, away, homeScore, awayScore }: Props) => {
  const row = (side: SeriesSideView, total: number) => (
    <tr className="border-border/50 border-t">
      <th
        scope="row"
        className={`px-4 py-3 text-left text-xs font-bold tracking-[0.1em] ${
          side.isSquad ? "text-primary" : "text-foreground"
        }`}
      >
        {side.code}
      </th>
      {cells.map((cell) => {
        const value = side.id === "HOME" ? cell.home : cell.away;

        return (
          <td
            key={cell.period}
            className={`px-4 py-3 text-center text-sm tabular-nums ${
              cell.isCurrent
                ? "bg-primary/10 text-primary font-semibold"
                : "text-foreground"
            }`}
          >
            {value ?? "–"}
          </td>
        );
      })}
      <td className="text-foreground px-4 py-3 text-center text-sm font-bold tabular-nums">
        {total}
      </td>
    </tr>
  );

  return (
    <div className="bg-card shadow-panel rounded-2xl">
      <p className="text-muted-foreground px-4 pt-4 pb-3 text-[0.625rem] font-semibold tracking-[0.18em]">
        LINE SCORE
      </p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-md">
          <thead>
            <tr className="text-muted-foreground text-[0.625rem] font-semibold tracking-[0.14em]">
              <th scope="col" className="px-4 pb-2 text-left">
                TEAM
              </th>
              {cells.map((cell) => (
                <th
                  key={cell.period}
                  scope="col"
                  className={`px-4 pb-2 text-center ${
                    cell.isCurrent ? "text-primary" : ""
                  }`}
                >
                  {periodLabel(cell.period)}
                </th>
              ))}
              <th scope="col" className="px-4 pb-2 text-center">
                T
              </th>
            </tr>
          </thead>
          <tbody>
            {row(home, homeScore)}
            {row(away, awayScore)}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LineScoreTable;
