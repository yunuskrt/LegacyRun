import React from "react";
import { POSITION_SOFT_BG, POSITION_TEXT } from "@/lib/position-style";
import type { Position } from "@/types/game";

type ChipSize = "sm" | "md";

type Props = {
  position: Position;
  size?: ChipSize;
};

const BOX: Record<ChipSize, string> = {
  sm: "size-7",
  md: "size-8",
};

const PositionChip = ({ position, size = "sm" }: Props) => (
  <span
    className={`flex shrink-0 items-center justify-center rounded-full text-[0.625rem] font-bold ${BOX[size]} ${POSITION_SOFT_BG[position]} ${POSITION_TEXT[position]}`}
  >
    {position}
  </span>
);

export default PositionChip;
