"use client";

import React from "react";
import type { Bracket } from "@/types/bracket";
import type { Run } from "@/types/game";

type RunContextValue = {
  run: Run | null;
  setRun: (run: Run) => void;
  bracket: Bracket | null;
  setBracket: (bracket: Bracket | null) => void;
};

const RunContext = React.createContext<RunContextValue | null>(null);

type Props = {
  children: React.ReactNode;
};

const RunProvider = ({ children }: Props) => {
  const [run, setRun] = React.useState<Run | null>(null);
  const [bracket, setBracket] = React.useState<Bracket | null>(null);
  const value = React.useMemo(
    () => ({ run, setRun, bracket, setBracket }),
    [run, bracket]
  );

  return <RunContext.Provider value={value}>{children}</RunContext.Provider>;
};

export const useRun = (): RunContextValue => {
  const value = React.useContext(RunContext);
  if (!value) throw new Error("useRun must be used inside a RunProvider");
  return value;
};

export default RunProvider;
