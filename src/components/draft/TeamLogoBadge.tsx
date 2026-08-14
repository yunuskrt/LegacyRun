"use client";

import React from "react";
import { useState } from "react";
import Image from "next/image";
import { teamInitials } from "@/lib/format";

type Props = {
  teamName: string;
  teamLogo: string;
};

const TeamLogoBadge = ({ teamName, teamLogo }: Props) => {
  const [hasLogo, setHasLogo] = useState(true);

  return (
    <span className="border-primary/45 bg-primary/10 flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border">
      {hasLogo ? (
        <Image
          src={teamLogo}
          alt={teamName}
          width={56}
          height={56}
          unoptimized
          className="size-full object-contain p-1.5"
          onError={() => setHasLogo(false)}
        />
      ) : (
        <span className="text-primary text-lg font-bold tracking-tight">
          {teamInitials(teamName)}
        </span>
      )}
    </span>
  );
};

export default TeamLogoBadge;
