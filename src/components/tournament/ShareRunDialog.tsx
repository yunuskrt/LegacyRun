"use client";

import React from "react";
import { Check, Download, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DEFAULT_SHARE_RATIO,
  SHARE_CARD_FILE_NAME,
  SHARE_CARD_RATIOS,
  SHARE_CARD_SIZES,
  ratioForViewport,
  shareCardPath,
} from "@/lib/share-card";
import type { ShareCard, ShareCardRatio } from "@/lib/share-card";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  card: ShareCard;
  onOpenChange: (open: boolean) => void;
};

// Long enough to read as confirmation, short enough that the label settles back.
const COPIED_MS = 2000;

type RenderStatus = "RENDERING" | "READY" | "FAILED";

// A failed render must say so — otherwise the placeholder reads as a hang.
const STATUS_MESSAGE: Record<Exclude<RenderStatus, "READY">, string> = {
  RENDERING: "Rendering your card…",
  FAILED: "That card could not be rendered. Try another shape.",
};

// Inside `DialogContent`, which Radix mounts only while open, so the viewport is
// read when the dialog opens rather than when the result screen appeared.
const SharePanel = ({ card }: { card: ShareCard }) => {
  const [ratio, setRatio] = React.useState<ShareCardRatio>(() =>
    typeof window === "undefined"
      ? DEFAULT_SHARE_RATIO
      : ratioForViewport(window.innerWidth)
  );
  const [copied, setCopied] = React.useState(false);
  const [status, setStatus] = React.useState<RenderStatus>("RENDERING");

  const path = shareCardPath(card, ratio);
  const ready = status === "READY";

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(
        new URL(path, window.location.href).href
      );
      setCopied(true);
      window.setTimeout(() => setCopied(false), COPIED_MS);
    } catch {
      setCopied(false);
    }
  };

  const chooseRatio = (next: ShareCardRatio) => {
    if (next === ratio) return;

    setStatus("RENDERING");
    setRatio(next);
  };

  return (
    <>
      <div
        role="group"
        aria-label="Card shape"
        className="border-border bg-secondary/60 flex shrink-0 gap-1 rounded-xl border p-1"
      >
        {SHARE_CARD_RATIOS.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => chooseRatio(option)}
            aria-pressed={option === ratio}
            className={cn(
              "min-h-11 flex-1 rounded-lg text-xs font-bold tracking-[0.12em] transition-colors",
              option === ratio
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {SHARE_CARD_SIZES[option].label}
          </button>
        ))}
      </div>

      <div className="bg-secondary/40 flex min-h-[40dvh] shrink items-center justify-center overflow-hidden rounded-xl p-3">
        {!ready && (
          <p
            role="status"
            className={cn(
              "px-4 text-center text-xs",
              status === "FAILED" ? "text-destructive" : "text-muted-foreground"
            )}
          >
            {STATUS_MESSAGE[status]}
          </p>
        )}
        {/* The route already returns a sized PNG, so re-encoding it through
              `/_next/image` would only cost a second render. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={path}
          src={path}
          alt={`${card.name} run card`}
          onLoad={() => setStatus("READY")}
          onError={() => setStatus("FAILED")}
          className={cn(
            "max-h-[52dvh] w-auto rounded-lg object-contain",
            ready ? "block" : "hidden"
          )}
        />
      </div>

      {/* Neither action is worth offering while there is no image behind it. */}
      <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
        <Button
          asChild={ready}
          disabled={!ready}
          className="min-h-11 flex-1 text-xs tracking-[0.14em]"
        >
          {ready ? (
            <a href={path} download={SHARE_CARD_FILE_NAME}>
              <Download aria-hidden="true" />
              Save image
            </a>
          ) : (
            <span>
              <Download aria-hidden="true" />
              Save image
            </span>
          )}
        </Button>

        <Button
          type="button"
          variant="secondary"
          onClick={copyLink}
          disabled={!ready}
          className="min-h-11 flex-1 text-xs tracking-[0.14em]"
        >
          {copied ? <Check aria-hidden="true" /> : <Link2 aria-hidden="true" />}
          {copied ? "Link copied" : "Copy link"}
        </Button>
      </div>
    </>
  );
};

const ShareRunDialog = ({ open, card, onOpenChange }: Props) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="flex max-h-[92dvh] flex-col overflow-y-auto p-6 sm:max-w-md">
      <DialogHeader className="shrink-0">
        <DialogTitle className="text-xl font-bold tracking-[0.16em] uppercase">
          Share Your Run
        </DialogTitle>
        <DialogDescription>
          Save the card, or copy a link that shows it to anyone who opens it.
        </DialogDescription>
      </DialogHeader>

      <SharePanel card={card} />
    </DialogContent>
  </Dialog>
);

export default ShareRunDialog;
