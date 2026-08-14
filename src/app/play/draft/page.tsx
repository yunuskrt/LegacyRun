import React from "react";
import DraftSectionHeading from "@/components/draft/DraftSectionHeading";
import DraftTopBar from "@/components/draft/DraftTopBar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TRADITIONAL_SLOTS } from "@/data";

type Props = {};

const DraftPage = ({}: Props) => {
  const filledSlots = 0;

  return (
    <main className="flex flex-1 flex-col gap-6">
      <DraftTopBar
        filledSlots={filledSlots}
        totalSlots={TRADITIONAL_SLOTS.length}
      />

      <div className="grid flex-1 gap-8 lg:grid-cols-[minmax(0,1.85fr)_minmax(0,1fr)] lg:items-start">
        <section>
          <DraftSectionHeading>Your Lineup</DraftSectionHeading>
          <Card className="bg-court shadow-panel min-h-[420px] items-center justify-center lg:min-h-[720px]">
            <h2 className="text-muted-foreground text-lg font-semibold">
              Lineup
            </h2>
          </Card>
        </section>

        <section>
          <DraftSectionHeading>Draft Board</DraftSectionHeading>
          <Card className="shadow-panel min-h-[320px] items-center justify-center lg:min-h-[420px]">
            <h2 className="text-muted-foreground text-lg font-semibold">
              Draft Board
            </h2>
          </Card>

          <div className="mt-6">
            <Button
              type="button"
              variant="secondary"
              size="lg"
              disabled
              className="h-14 w-full text-base font-bold tracking-[0.18em] uppercase"
            >
              Start Tournament
            </Button>
            <p className="text-muted-foreground mt-3 text-center text-sm">
              Complete your 5-player lineup to continue.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
};

export default DraftPage;
