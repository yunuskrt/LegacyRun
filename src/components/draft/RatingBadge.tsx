import React from "react";
import { cn } from "@/lib/utils";

type Props = {
  rating: number;
  dimmed?: boolean;
};

// The roster card's chip and the confirm dialog's. `CourtSlot` keeps its own:
// that one is sized in `cqw` so the lineup scales as one unit.
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
