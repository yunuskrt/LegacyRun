"use client";

import React from "react";
import { motion, useReducedMotion } from "motion/react";
import { FADE_RISE, transitionFor } from "@/lib/motion";
import { cn } from "@/lib/utils";

type Props = {
  id: string;
  eyebrow: string;
  title: string;
  className?: string;
  children: React.ReactNode;
};

const LandingSection = ({ id, eyebrow, title, className, children }: Props) => {
  const reduced = useReducedMotion() ?? false;
  const headingId = `${id}-title`;

  return (
    <motion.section
      id={id}
      aria-labelledby={headingId}
      className={cn("border-border/50 border-t px-6 py-20 sm:py-24", className)}
      data-motion-reveal
      initial={FADE_RISE.initial}
      whileInView={FADE_RISE.animate}
      viewport={{ once: true, amount: 0.15 }}
      transition={transitionFor("slow", reduced)}
    >
      <div className="mx-auto w-full max-w-6xl">
        <p className="text-muted-foreground text-xs font-semibold tracking-[0.22em] uppercase">
          {eyebrow}
        </p>
        <h2
          id={headingId}
          className="mt-3 text-3xl font-bold tracking-tight text-balance sm:text-4xl"
        >
          {title}
        </h2>
        {children}
      </div>
    </motion.section>
  );
};

export default LandingSection;
