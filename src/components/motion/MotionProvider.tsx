"use client";

import React from "react";
import { MotionConfig } from "motion/react";

type Props = {
  children: React.ReactNode;
};

// Covers `motion` components only — CSS transitions and loops are guarded elsewhere.
const MotionProvider = ({ children }: Props) => (
  <MotionConfig reducedMotion="user">{children}</MotionConfig>
);

export default MotionProvider;
