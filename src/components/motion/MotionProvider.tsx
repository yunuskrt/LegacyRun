"use client";

import React from "react";
import { MotionConfig } from "motion/react";

type Props = {
  children: React.ReactNode;
};

// Every `motion` component degrades on its own, so none of them has to opt in.
// This does not cover CSS transitions or looping animations — see the
// prefers-reduced-motion block in globals.css and useReducedMotion() callers.
const MotionProvider = ({ children }: Props) => (
  <MotionConfig reducedMotion="user">{children}</MotionConfig>
);

export default MotionProvider;
