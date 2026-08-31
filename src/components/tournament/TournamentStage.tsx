"use client";

import React from "react";
import { AnimatePresence, motion } from "motion/react";

export type StageId = "BRACKET" | "SERIES" | "RESULT";

type Props = {
  stage: StageId;
  children: React.ReactNode;
};

const TournamentStage = ({ stage, children }: Props) => (
  <AnimatePresence mode="wait">
    <motion.div
      key={stage}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  </AnimatePresence>
);

export default TournamentStage;
