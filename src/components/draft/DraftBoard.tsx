"use client";

import React from "react";
import { AnimatePresence, motion } from "motion/react";
import { Dices } from "lucide-react";
import RerollPool from "@/components/draft/RerollPool";
import RosterPlayerCard from "@/components/draft/RosterPlayerCard";
import TeamLogoBadge from "@/components/draft/TeamLogoBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatSeason } from "@/lib/format";
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
  canGetTeam: boolean;
  canReroll: boolean;
  onGetRandomTeam: () => void;
  onReroll: (kind: RerollKind) => void;
  onDraftPlayer: (player: DraftablePlayer, position: Position) => void;
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
  canGetTeam,
  canReroll,
  onGetRandomTeam,
  onReroll,
  onDraftPlayer,
}: Props) => {
  const stateKey = isComplete ? "complete" : team ? team.teamSeasonId : "idle";

  return (
    <Card className="shadow-panel gap-0 p-5">
      <AnimatePresence mode="wait">
        <motion.div
          key={stateKey}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
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

              <div className="grid grid-cols-2 gap-3">
                {team.players.map((player, index) => (
                  <motion.div
                    key={player.playerSeasonId}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.22, delay: index * 0.03 }}
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
                    />
                  </motion.div>
                ))}
              </div>
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
