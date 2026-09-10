"use client";

import React from "react";
import { useState } from "react";
import Image from "next/image";
import { teamInitials } from "@/lib/format";

type BadgeSize = "sm" | "md" | "court";

type Props = {
  teamName: string;
  teamLogo: string;
  size?: BadgeSize;
};

// `court` is sized in cqw so it scales with the court, unlike the two px sizes.
const BOX: Record<BadgeSize, string> = {
  sm: "size-9 rounded-lg",
  md: "size-14 rounded-xl",
  court: "size-[4.6cqw] rounded-[0.5cqw]",
};

const FALLBACK_TEXT: Record<BadgeSize, string> = {
  sm: "text-[0.625rem]",
  md: "text-lg",
  court: "text-[clamp(0.35rem,1.2cqw,0.6rem)]",
};

// At court size the box is ~16px, where a fixed 6px inset would leave almost no logo.
const INSET: Record<BadgeSize, string> = {
  sm: "p-1.5",
  md: "p-1.5",
  court: "p-[0.3cqw]",
};

const TeamLogoBadge = ({ teamName, teamLogo, size = "md" }: Props) => {
  const [hasLogo, setHasLogo] = useState(true);

  return (
    <span
      className={`border-primary/45 bg-primary/10 flex shrink-0 items-center justify-center overflow-hidden border ${BOX[size]}`}
    >
      {hasLogo ? (
        <Image
          src={teamLogo}
          alt={teamName}
          width={56}
          height={56}
          className={`size-full object-contain ${INSET[size]}`}
          onError={() => setHasLogo(false)}
        />
      ) : (
        <span
          className={`text-primary font-bold tracking-tight ${FALLBACK_TEXT[size]}`}
        >
          {teamInitials(teamName)}
        </span>
      )}
    </span>
  );
};

export default TeamLogoBadge;
