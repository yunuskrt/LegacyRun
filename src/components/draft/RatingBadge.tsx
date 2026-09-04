import React from "react";
import { cn } from "@/lib/utils";

type Props = {
  rating: number;
  dimmed?: boolean;
};

// `CourtSlot` keeps its own chip — that one is sized in `cqw` to scale with the court.
const RatingBadge = ({ rating, dimmed = false }: Props) => {
  return (
    <span
      className={cn(
        "rounded-md px-2 py-0.5 text-sm font-bold",
        dimmed
          ? "bg-primary/25 text-primary-foreground/70"
          : "bg-primary text-primary-foreground"
      )}
    >
      {rating}
    </span>
  );
};

export default RatingBadge;
