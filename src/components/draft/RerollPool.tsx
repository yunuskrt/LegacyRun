import React from "react";
import { Dices, Repeat2, SkipForward } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type Props = {
  rerollsLeft: number;
  totalRerolls: number;
  isDisabled: boolean;
};

const REROLL_ACTIONS = [
  { label: "Another Team", Icon: Repeat2 },
  { label: "Another Season", Icon: Dices },
  { label: "Skip Round", Icon: SkipForward },
] as const;

const RerollPool = ({ rerollsLeft, totalRerolls, isDisabled }: Props) => {
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
        {REROLL_ACTIONS.map(({ label, Icon }) => (
          <button
            key={label}
            type="button"
            disabled={isDisabled}
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
