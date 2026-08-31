"use client";

import React from "react";
import { animate, motion, useMotionValue, useTransform } from "motion/react";

type Props = {
  value: number;
  className?: string;
};

// The score climbs to each running total rather than snapping to it — the
// tween is what makes a precomputed log read as a live game.
const TweenNumber = ({ value, className }: Props) => {
  const raw = useMotionValue(value);
  const rounded = useTransform(raw, (current) => Math.round(current));

  React.useEffect(() => {
    const controls = animate(raw, value, { duration: 0.4, ease: "easeOut" });

    return () => controls.stop();
  }, [raw, value]);

  return <motion.span className={className}>{rounded}</motion.span>;
};

export default TweenNumber;
