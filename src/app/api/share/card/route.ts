import { ImageResponse } from "next/og";
import ShareCardImage from "@/components/share/ShareCardImage";
import {
  createGate,
  enterGate,
  leaveGate,
  rateLimit,
  SHARE_CARD_BUDGET,
} from "@/lib/rate-limit";
import {
  SHARE_CARD_SIZES,
  decodeShareCard,
  parseShareRatio,
} from "@/lib/share-card";
import { loadShareLogos, readLogoFromDisk } from "@/lib/share-logos";

// The most expensive thing this app does, and it answers anyone. The third
// caller is turned away rather than queued, so a burst costs a cheap 429.
const MAX_CONCURRENT_RENDERS = 2;

const renderGate = createGate(MAX_CONCURRENT_RENDERS);

// Long enough to clear the renders ahead, short enough to retry by hand.
const BUSY_RETRY_SECONDS = 5;

const PNG_HEADERS: Record<string, string> = {
  "Content-Type": "image/png",
  // The image is a pure function of its URL, so it never goes stale.
  "Cache-Control": "public, max-age=31536000, immutable",
  // The payload steers what is drawn, so the bytes are never re-interpreted.
  "X-Content-Type-Options": "nosniff",
};

const throttled = (retryAfterSeconds: number): Response =>
  new Response("Too many share cards requested", {
    status: 429,
    headers: {
      "Retry-After": String(retryAfterSeconds),
      "Cache-Control": "no-store",
    },
  });

export async function GET(request: Request) {
  const limit = rateLimit(request.headers, SHARE_CARD_BUDGET);

  if (!limit.allowed) {
    return throttled(limit.retryAfterSeconds);
  }

  const url = new URL(request.url);
  const card = decodeShareCard(url.searchParams.get("d") ?? "");

  if (!card) {
    return new Response("Invalid share card", { status: 400 });
  }

  const ratio = parseShareRatio(url.searchParams.get("ratio"));
  const size = SHARE_CARD_SIZES[ratio];

  // Entered only once the request is known to be worth rendering, so a bad
  // payload never occupies a slot.
  if (!enterGate(renderGate)) {
    return throttled(BUSY_RETRY_SECONDS);
  }

  try {
    const logos = await loadShareLogos(
      card.five.map((player) => player.slug),
      readLogoFromDisk
    );

    // Satori renders as the stream is read, so awaiting the bytes here is what
    // turns a render failure into a 500 instead of a half-written response.
    const png = await new ImageResponse(
      ShareCardImage({ card, ratio, logos }),
      {
        width: size.width,
        height: size.height,
      }
    ).arrayBuffer();

    return new Response(png, { headers: PNG_HEADERS });
  } catch (error) {
    console.error("[api/share/card] render failed", error);

    return new Response("Failed to render share card", { status: 500 });
  } finally {
    // The slot is held for the whole render, including the failing ones.
    leaveGate(renderGate);
  }
}
