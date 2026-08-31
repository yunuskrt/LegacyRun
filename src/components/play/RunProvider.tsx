"use client";

import React from "react";
import { DEFAULT_MODE, DEFAULT_SPEED } from "@/lib/series-flow";
import type { ReplayMode } from "@/lib/series-flow";
import type { ReplaySpeed } from "@/lib/replay";
import type { Bracket } from "@/types/bracket";
import type { MatchData, SeriesState } from "@/types/match";
import type { Run } from "@/types/game";

type RunContextValue = {
  run: Run | null;
  setRun: (run: Run) => void;
  bracket: Bracket | null;
  setBracket: (bracket: Bracket | null) => void;
  matchData: MatchData | null;
  setMatchData: (data: MatchData | null) => void;
  series: SeriesState[];
  setSeries: React.Dispatch<React.SetStateAction<SeriesState[]>>;
  // Run-level preferences: they outlive a game and a round, and changing one
  // never touches replay state.
  speed: ReplaySpeed;
  setSpeed: (speed: ReplaySpeed) => void;
  mode: ReplayMode;
  setMode: (mode: ReplayMode) => void;
};

const RunContext = React.createContext<RunContextValue | null>(null);

type Props = {
  children: React.ReactNode;
};

const RunProvider = ({ children }: Props) => {
  const [run, setRun] = React.useState<Run | null>(null);
  const [bracket, setBracket] = React.useState<Bracket | null>(null);
  const [matchData, setMatchData] = React.useState<MatchData | null>(null);
  const [series, setSeries] = React.useState<SeriesState[]>([]);
  const [speed, setSpeed] = React.useState<ReplaySpeed>(DEFAULT_SPEED);
  const [mode, setMode] = React.useState<ReplayMode>(DEFAULT_MODE);
  const value = React.useMemo(
    () => ({
      run,
      setRun,
      bracket,
      setBracket,
      matchData,
      setMatchData,
      series,
      setSeries,
      speed,
      setSpeed,
      mode,
      setMode,
    }),
    [run, bracket, matchData, series, speed, mode]
  );

  return <RunContext.Provider value={value}>{children}</RunContext.Provider>;
};

export const useRun = (): RunContextValue => {
  const value = React.useContext(RunContext);
  if (!value) throw new Error("useRun must be used inside a RunProvider");
  return value;
};

export default RunProvider;
