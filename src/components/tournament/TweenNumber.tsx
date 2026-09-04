"use client";

import React from "react";
import { animate, motion, useMotionValue, useTransform } from "motion/react";
import { DURATION, EASE } from "@/lib/motion";

type Props = {
  value: number;
  className?: string;
};

// The score climbs rather than snaps — what makes a precomputed log read as live.
const TweenNumber = ({ value, className }: Props) => {
  const raw = useMotionValue(value);
  const rounded = useTransform(raw, (current) => Math.round(current));

  React.useEffect(() => {
    const controls = animate(raw, value, {
      duration: DURATION.slow,
      ease: EASE.enter,
    });

    return () => controls.stop();
  }, [raw, value]);

  return <motion.span className={className}>{rounded}</motion.span>;
};

export default TweenNumber;
