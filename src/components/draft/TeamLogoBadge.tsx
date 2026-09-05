"use client";

import React from "react";
import { useState } from "react";
import Image from "next/image";
import { teamInitials } from "@/lib/format";

type BadgeSize = "sm" | "md";

type Props = {
  teamName: string;
  teamLogo: string;
  size?: BadgeSize;
};

const BOX: Record<BadgeSize, string> = {
  sm: "size-9 rounded-lg",
  md: "size-14 rounded-xl",
};

const FALLBACK_TEXT: Record<BadgeSize, string> = {
  sm: "text-[0.625rem]",
  md: "text-lg",
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
          className="size-full object-contain p-1.5"
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
