"use client";

import React from "react";
import { AnimatePresence, motion } from "motion/react";
import { FADE_RISE, transitionFor } from "@/lib/motion";

export type StageId = "BRACKET" | "SERIES" | "RESULT" | "ARCHIVE";

type Props = {
  stage: StageId;
  children: React.ReactNode;
};

const TournamentStage = ({ stage, children }: Props) => (
  <AnimatePresence mode="wait">
    <motion.div
      key={stage}
      initial={FADE_RISE.initial}
      animate={FADE_RISE.animate}
      exit={FADE_RISE.exit}
      transition={transitionFor("base")}
    >
      {children}
    </motion.div>
  </AnimatePresence>
);

export default TournamentStage;
