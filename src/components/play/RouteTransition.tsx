"use client";

import React from "react";
import { motion } from "motion/react";
import { usePathname } from "next/navigation";
import { FADE_RISE, transitionFor } from "@/lib/motion";

type Props = {
  children: React.ReactNode;
};

// Enter-only — the App Router unmounts the outgoing page before the incoming one renders.
const RouteTransition = ({ children }: Props) => {
  const pathname = usePathname();

  return (
    <motion.div
      key={pathname}
      initial={FADE_RISE.initial}
      animate={FADE_RISE.animate}
      transition={transitionFor("base")}
      className="flex flex-1 flex-col"
    >
      {children}
    </motion.div>
  );
};

export default RouteTransition;
