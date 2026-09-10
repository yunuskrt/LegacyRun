import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
};

const StartGameButton = ({ className }: Props) => {
  return (
    <Button
      asChild
      className={cn(
        "bg-gold text-primary-foreground shadow-trophy h-12 gap-2 px-8 text-sm font-bold tracking-[0.14em] uppercase hover:brightness-110",
        className
      )}
    >
      <Link href="/play/draft">Start Game</Link>
    </Button>
  );
};

export default StartGameButton;
