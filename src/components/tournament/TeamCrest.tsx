import React from "react";

type CrestSize = "xs" | "sm" | "md" | "lg" | "xl";

type Props = {
  code: string;
  isSquad: boolean;
  size?: CrestSize;
  glow?: boolean;
};

// One literal per size — Tailwind cannot see a class name built at runtime.
// Five entries because the five call sites genuinely render five sizes; folding
// any two together would silently resize a screen this refactor does not own.
const BOX: Record<CrestSize, string> = {
  xs: "size-9 text-[0.625rem]",
  sm: "size-10 text-xs",
  md: "size-11 text-[0.625rem]",
  lg: "size-12 text-[0.6875rem]",
  xl: "size-20 text-xl sm:size-24 sm:text-2xl",
};

const TeamCrest = ({ code, isSquad, size = "xs", glow = false }: Props) => (
  <span
    className={`flex shrink-0 items-center justify-center rounded-full border font-bold tracking-tight ${BOX[size]} ${
      isSquad
        ? "border-primary bg-primary/15 text-primary"
        : "border-border bg-secondary text-muted-foreground"
    } ${glow ? "shadow-trophy" : ""}`}
  >
    {code}
  </span>
);

export default TeamCrest;
