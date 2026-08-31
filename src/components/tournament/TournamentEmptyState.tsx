import React from "react";
import Link from "next/link";
import { LoaderCircle, TriangleAlert } from "lucide-react";

type Props = {
  kind: "LOADING" | "NO_RUN" | "ERROR";
  message?: string;
  onRetry?: () => void;
};

const TournamentEmptyState = ({ kind, message, onRetry }: Props) => {
  if (kind === "LOADING") {
    return (
      <div className="flex flex-col items-center gap-6 py-20">
        <LoaderCircle
          className="text-primary size-7 animate-spin"
          aria-hidden="true"
        />
        <p className="text-primary text-[0.6875rem] font-semibold tracking-[0.18em]">
          BUILDING YOUR BRACKET…
        </p>
        <div
          className="flex w-full max-w-2xl flex-col gap-3"
          aria-hidden="true"
        >
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className="bg-card/60 h-20 animate-pulse rounded-xl"
            />
          ))}
        </div>
      </div>
    );
  }

  if (kind === "NO_RUN") {
    return (
      <div className="flex flex-col items-center gap-4 py-20">
        <p className="text-muted-foreground text-center text-lg">
          No squad in play. Draft a lineup to start a tournament.
        </p>
        <Link href="/play/draft" className="text-primary underline">
          Back to the draft
        </Link>
      </div>
    );
  }

  return (
    <div className="flex justify-center py-20">
      <div className="border-destructive/70 bg-card w-full max-w-md rounded-2xl border px-6 py-8 text-center">
        <TriangleAlert
          className="text-destructive mx-auto size-7"
          aria-hidden="true"
        />
        <h2 className="text-foreground mt-4 text-xl font-bold">
          We couldn&apos;t load the bracket
        </h2>
        <p className="text-muted-foreground mt-2 text-sm">
          {message ?? "Something went wrong on our end. Your run is safe."}
        </p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="border-destructive/70 text-destructive mt-6 w-full rounded-lg border px-4 py-3 text-xs font-semibold tracking-[0.16em] uppercase"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
};

export default TournamentEmptyState;
