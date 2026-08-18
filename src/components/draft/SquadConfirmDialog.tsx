"use client";

import React from "react";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { abbreviatePlayerName, formatSeason } from "@/lib/format";
import { POSITION_BG, POSITION_TEXT } from "@/lib/position-style";
import { MAX_SQUAD_NAME_LENGTH, orderMembersBySlots } from "@/lib/run";
import { cn } from "@/lib/utils";
import type { Conference, Position, SquadMember } from "@/types/game";

const CONFERENCES: readonly Conference[] = ["EAST", "WEST"];

type Props = {
  open: boolean;
  members: readonly SquadMember[];
  slots: readonly Position[];
  onOpenChange: (open: boolean) => void;
  onConfirm: (name: string, conference: Conference) => void;
};

const SquadConfirmDialog = ({
  open,
  members,
  slots,
  onOpenChange,
  onConfirm,
}: Props) => {
  const [name, setName] = React.useState("");
  const [conference, setConference] = React.useState<Conference | null>(null);
  const ordered = orderMembersBySlots(members, slots);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92dvh] flex-col overflow-y-auto p-6 sm:max-w-lg">
        <DialogHeader className="shrink-0">
          <DialogTitle className="text-xl font-bold tracking-[0.16em] uppercase">
            Confirm Your Squad
          </DialogTitle>
          <DialogDescription>
            Review your five legends, name the squad, and choose a conference.
          </DialogDescription>
        </DialogHeader>

        <Input
          value={name}
          maxLength={MAX_SQUAD_NAME_LENGTH}
          onChange={(event) => setName(event.target.value)}
          placeholder="Name your squad (optional)"
          aria-label="Squad name (optional)"
          className="border-primary/70 h-12 shrink-0 text-base"
        />

        {/* Only the roster scrolls, so the controls survive a short viewport. */}
        <ul className="flex min-h-0 shrink flex-col gap-2 overflow-y-auto [@media(min-height:40rem)]:min-h-24">
          {ordered.map((member) => (
            <li
              key={member.playerSeasonId}
              className="border-border/70 bg-secondary/45 relative flex items-center gap-4 overflow-hidden rounded-xl border py-3 pr-4 pl-5"
            >
              <span
                className={cn(
                  "absolute inset-y-0 left-0 w-1",
                  POSITION_BG[member.position]
                )}
              />
              <span
                className={cn(
                  "w-7 shrink-0 text-xs font-bold",
                  POSITION_TEXT[member.position]
                )}
              >
                {member.position}
              </span>

              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">
                  {abbreviatePlayerName(member.name)}
                </p>
                <p className="text-muted-foreground truncate text-xs tracking-[0.08em] uppercase">
                  {member.teamName} · {formatSeason(member.seasonYear)}
                </p>
              </div>

              <span className="bg-primary text-primary-foreground rounded-md px-2 py-0.5 text-sm font-bold">
                {member.rating}
              </span>
            </li>
          ))}
        </ul>

        <div className="shrink-0">
          <p className="text-muted-foreground mb-2 text-xs tracking-[0.16em] uppercase">
            Conference · Required
          </p>
          <div className="grid grid-cols-2 gap-3">
            {CONFERENCES.map((option) => (
              <Button
                key={option}
                type="button"
                variant="secondary"
                size="lg"
                aria-pressed={conference === option}
                onClick={() => setConference(option)}
                className={cn(
                  "h-12 font-bold tracking-[0.16em] uppercase",
                  conference === option
                    ? "border-primary text-primary bg-primary/10 border"
                    : "text-muted-foreground"
                )}
              >
                {option}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-center gap-2 sm:flex-row sm:justify-end sm:gap-4">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="lg"
            disabled={conference === null}
            onClick={() => conference && onConfirm(name, conference)}
            className={cn(
              "h-12 w-full font-bold tracking-[0.16em] uppercase sm:w-auto",
              conference === null
                ? "bg-secondary text-muted-foreground"
                : "bg-gold"
            )}
          >
            <ShieldCheck className="size-5" />
            Start Tournament
          </Button>
        </div>

        {conference === null && (
          <p className="text-muted-foreground -mt-2 shrink-0 text-center text-sm sm:text-right">
            Pick a conference to continue.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SquadConfirmDialog;
