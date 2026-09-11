import { ImageResponse } from "next/og";
import ShareCardImage from "@/components/share/ShareCardImage";
import {
  SHARE_CARD_SIZES,
  decodeShareCard,
  parseShareRatio,
} from "@/lib/share-card";
import { loadShareLogos } from "@/lib/share-logos";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const card = decodeShareCard(url.searchParams.get("d") ?? "");

  if (!card) {
    return new Response("Invalid share card", { status: 400 });
  }

  const ratio = parseShareRatio(url.searchParams.get("ratio"));
  const size = SHARE_CARD_SIZES[ratio];

  try {
    const logos = await loadShareLogos(
      card.five.map((player) => player.slug),
      url.origin,
      fetch
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

    return new Response(png, {
      headers: {
        "Content-Type": "image/png",
        // The image is a pure function of its URL, so it never goes stale.
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("[api/share/card] render failed", error);

    return new Response("Failed to render share card", { status: 500 });
  }
}
