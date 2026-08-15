import React from "react";
import { Dices, Repeat2, SkipForward, type LucideIcon } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import type { RerollKind } from "@/lib/draft";
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
  return (
    <div>
      <Separator className="mb-4" />

      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-muted-foreground text-xs tracking-[0.16em] uppercase sm:text-sm">
          Shared reroll pool
        </p>
        <p className="text-primary text-xs font-bold sm:text-sm">
          Rerolls left: {rerollsLeft} / {totalRerolls}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {REROLL_ACTIONS.map(({ kind, label, Icon }) => (
          <button
            key={kind}
            type="button"
            disabled={isDisabled}
            onClick={() => onReroll(kind)}
            className={cn(
              "border-border/70 bg-secondary/45 focus-visible:ring-ring/60 flex flex-col items-center gap-2 rounded-xl border px-2 py-4 text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none",
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
