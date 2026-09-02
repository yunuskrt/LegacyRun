"use client";

import React from "react";
import { motion, useReducedMotion } from "motion/react";
import { Dices, Repeat2, SkipForward, type LucideIcon } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import type { RerollKind } from "@/lib/draft";
import { transitionFor } from "@/lib/motion";
import { cn } from "@/lib/utils";

type Props = {
  rerollsLeft: number;
  totalRerolls: number;
  isDisabled: boolean;
  onReroll: (kind: RerollKind) => void;
};

const REROLL_ACTIONS = [
  { kind: "ANOTHER_TEAM", label: "Another Team", Icon: Repeat2 },
  { kind: "ANOTHER_SEASON", label: "Another Season", Icon: Dices },
  { kind: "SKIP_ROUND", label: "Skip Round", Icon: SkipForward },
] as const satisfies readonly {
  kind: RerollKind;
  label: string;
  Icon: LucideIcon;
}[];

const RerollPool = ({
  rerollsLeft,
  totalRerolls,
  isDisabled,
  onReroll,
}: Props) => {
  const reduced = useReducedMotion() ?? false;

  return (
    <div>
      <Separator className="mb-4" />

      {/* The gaps are tight because the dots cost ~30px the row did not have:
          at 1024 and at 390 the label wrapped to two lines without them. */}
      <div className="mb-3 flex items-center justify-between gap-2">
        {/* The board column is at its narrowest between lg and xl, not at 390,
            so the type step waits for xl rather than sm. */}
        <p className="text-muted-foreground text-xs tracking-[0.16em] uppercase xl:text-sm">
          Shared reroll pool
        </p>
        <div className="flex shrink-0 items-center gap-1.5">
          {/* The dots are decoration; the count beside them is the label. */}
          <span className="flex items-center gap-0.5" aria-hidden="true">
            {Array.from({ length: totalRerolls }, (_, index) => (
              <span
                key={index}
                className="bg-muted-foreground/25 relative block h-1.5 w-2.5 rounded-full"
              >
                <motion.span
                  className="bg-primary absolute inset-0 rounded-full"
                  initial={false}
                  animate={{
                    opacity: index < rerollsLeft ? 1 : 0,
                    scale: index < rerollsLeft ? 1 : 0.6,
                  }}
                  transition={transitionFor("quick", reduced)}
                />
              </span>
            ))}
          </span>
          <p className="text-primary text-xs font-bold xl:text-sm">
            Rerolls left: {rerollsLeft} / {totalRerolls}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {REROLL_ACTIONS.map(({ kind, label, Icon }) => (
          <button
            key={kind}
            type="button"
            disabled={isDisabled}
            onClick={() => onReroll(kind)}
            className={cn(
              "border-border/70 bg-secondary/45 focus-visible:ring-ring/60 flex flex-col items-center gap-2 rounded-xl border px-2 py-4 text-sm transition-[color,background-color,border-color,opacity] duration-[var(--duration-quick)] focus-visible:ring-2 focus-visible:outline-none",
              isDisabled
                ? "text-muted-foreground cursor-not-allowed opacity-50"
                : "hover:border-primary/50 hover:bg-secondary/80 cursor-pointer"
            )}
          >
            <Icon className="size-5" />
            <span className="hidden text-center leading-tight sm:block">
              {label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default RerollPool;
