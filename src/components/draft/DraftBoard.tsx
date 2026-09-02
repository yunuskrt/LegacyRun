"use client";

import React from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Dices, Loader2 } from "lucide-react";
import RerollPool from "@/components/draft/RerollPool";
import RosterPlayerCard from "@/components/draft/RosterPlayerCard";
import TeamLogoBadge from "@/components/draft/TeamLogoBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatSeason } from "@/lib/format";
import { FADE_RISE, staggeredTransition, transitionFor } from "@/lib/motion";
import { POSITION_TEXT } from "@/lib/position-style";
import { cn } from "@/lib/utils";
import type { PlayerAvailability, RerollKind } from "@/lib/draft";
import type { DraftablePlayer, DraftTeam, Position } from "@/types/game";

type Props = {
  team?: DraftTeam;
  selectedPosition: Position | null;
  availabilityOf: (player: DraftablePlayer) => PlayerAvailability;
  openPositions: Position[];
  rerollsLeft: number;
  totalRerolls: number;
  isComplete: boolean;
  isFetchingTeam: boolean;
  canGetTeam: boolean;
  canReroll: boolean;
  onGetRandomTeam: () => void;
  onReroll: (kind: RerollKind) => void;
  onDraftPlayer: (player: DraftablePlayer, position: Position) => void;
  onHoverPlayer: (player: DraftablePlayer | null) => void;
  onDragPlayer: (player: DraftablePlayer | null) => void;
};

const PLACEHOLDER_ICON =
  "border-border text-muted-foreground mx-auto flex size-16 items-center justify-center rounded-xl border border-dashed";

const DraftBoard = ({
  team,
  selectedPosition,
  availabilityOf,
  openPositions,
  rerollsLeft,
  totalRerolls,
  isComplete,
  isFetchingTeam,
  canGetTeam,
  canReroll,
  onGetRandomTeam,
  onReroll,
  onDraftPlayer,
  onHoverPlayer,
  onDragPlayer,
}: Props) => {
  const reduced = useReducedMotion() ?? false;
  const stateKey = isComplete
    ? "complete"
    : isFetchingTeam && !team
      ? "loading"
      : team
        ? team.teamSeasonId
        : "idle";

  return (
    <Card className="shadow-panel gap-0 p-5">
      <AnimatePresence mode="wait">
        <motion.div
          key={stateKey}
          initial={FADE_RISE.initial}
          animate={FADE_RISE.animate}
          exit={FADE_RISE.exit}
          transition={transitionFor("base", reduced)}
          className="mb-5"
        >
          {isComplete ? (
            <div className="py-6 text-center">
              <span className={PLACEHOLDER_ICON}>
                <Dices className="size-7" />
              </span>
              <p className="mt-5 text-xl font-bold">Lineup complete</p>
              <p className="text-muted-foreground mt-1">
                Your five legends are locked in.
              </p>
            </div>
          ) : team ? (
            <div>
              <div className="flex items-center gap-4">
                <TeamLogoBadge
                  teamName={team.teamName}
                  teamLogo={team.teamLogo}
                />
                <div className="min-w-0">
                  <p className="truncate text-xl font-bold">
                    {formatSeason(team.seasonYear)} {team.teamName}
                  </p>
                  <p className="text-muted-foreground text-sm tracking-[0.14em] uppercase">
                    Team rating {team.teamRating}
                  </p>
                </div>
              </div>

              <p className="text-muted-foreground mt-5 mb-3 text-sm tracking-[0.14em] uppercase">
                {selectedPosition ? (
                  <>
                    Roster · Pick a{" "}
                    <span
                      className={cn(
                        "font-bold",
                        POSITION_TEXT[selectedPosition]
                      )}
                    >
                      {selectedPosition}
                    </span>
                  </>
                ) : (
                  <>
                    Roster · Select an open slot{" "}
                    {openPositions.map((position) => (
                      <span
                        key={position}
                        className={cn(
                          "ml-1 font-bold",
                          POSITION_TEXT[position]
                        )}
                      >
                        {position}
                      </span>
                    ))}
                  </>
                )}
              </p>

              <div className="grid max-h-[26rem] grid-cols-2 gap-3 overflow-y-auto pr-1">
                {team.players.map((player, index) => (
                  <motion.div
                    key={player.playerSeasonId}
                    initial={FADE_RISE.initial}
                    animate={FADE_RISE.animate}
                    transition={staggeredTransition("base", index, {
                      reduced,
                    })}
                    // On the wrapper, not the card: a disabled <button> does not
                    // dispatch pointer events, and hovering a blocked player
                    // must still tell the court to stop inviting.
                    onPointerEnter={() => onHoverPlayer(player)}
                    onPointerLeave={() => onHoverPlayer(null)}
                  >
                    <RosterPlayerCard
                      player={player}
                      availability={availabilityOf(player)}
                      selectedPosition={selectedPosition}
                      onDraft={() =>
                        onDraftPlayer(
                          player,
                          selectedPosition ?? player.position
                        )
                      }
                      onDragChange={(dragging) =>
                        onDragPlayer(dragging ? player : null)
                      }
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          ) : isFetchingTeam ? (
            <div className="py-6 text-center">
              <span className={PLACEHOLDER_ICON}>
                <Loader2 className="size-7 animate-spin" />
              </span>
              <p className="mt-5 text-lg font-bold">Drawing a team</p>
              <p className="text-muted-foreground mt-1">
                Pulling a season from 1,292 historical rosters.
              </p>
            </div>
          ) : (
            <div className="py-6 text-center">
              <span className={PLACEHOLDER_ICON}>
                <Dices className="size-7" />
              </span>
              <p className="mt-5 text-lg font-bold">
                Open slots:{" "}
                {openPositions.map((position, index) => (
                  <React.Fragment key={position}>
                    {index > 0 && (
                      <span className="text-muted-foreground"> · </span>
                    )}
                    <span className={POSITION_TEXT[position]}>{position}</span>
                  </React.Fragment>
                ))}
              </p>
              <p className="text-muted-foreground mt-1">
                Reveal a historical team and season to see its roster.
              </p>
              <Button
                type="button"
                size="lg"
                disabled={!canGetTeam}
                onClick={onGetRandomTeam}
                className="bg-gold mt-5 font-bold"
              >
                Get Random Team
              </Button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <RerollPool
        rerollsLeft={rerollsLeft}
        totalRerolls={totalRerolls}
        isDisabled={!canReroll}
        onReroll={onReroll}
      />
    </Card>
  );
};

export default DraftBoard;
