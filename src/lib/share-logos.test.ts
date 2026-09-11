import { describe, expect, it, vi } from "vitest";
import { loadShareLogos, logoDataUri } from "@/lib/share-logos";
import type { LogoFetch } from "@/lib/share-logos";

const ORIGIN = "http://localhost:3000";

const bytesOf = (...values: number[]): ArrayBuffer =>
  Uint8Array.from(values).buffer;

// Stands in for `fetch`: every slug in `available` returns bytes, the rest 404.
const fetcherFor = (
  available: Record<string, ArrayBuffer>,
  onRequest?: (url: string) => void
): LogoFetch =>
  vi.fn(async (url: string) => {
    onRequest?.(url);

    const slug = url.split("/").pop()?.replace(".png", "") ?? "";
    const bytes = available[slug];

    return bytes
      ? { ok: true, arrayBuffer: async () => bytes }
      : { ok: false, arrayBuffer: async () => new ArrayBuffer(0) };
  });

describe("logoDataUri", () => {
  it("wraps the bytes as a base64 png data URI", () => {
    expect(logoDataUri(bytesOf(0, 1, 2, 253))).toBe(
      "data:image/png;base64,AAEC/Q=="
    );
  });

  it("survives the full byte range", () => {
    const all = Uint8Array.from({ length: 256 }, (_, index) => index);
    const uri = logoDataUri(all.buffer);

    expect(uri.startsWith("data:image/png;base64,")).toBe(true);
    expect(
      Buffer.from(uri.slice("data:image/png;base64,".length), "base64")
    ).toEqual(Buffer.from(all));
  });
});

describe("loadShareLogos", () => {
  it("resolves each slug to a data URI", async () => {
    const logos = await loadShareLogos(
      ["CHI", "LAL"],
      ORIGIN,
      fetcherFor({ CHI: bytesOf(1, 2), LAL: bytesOf(3, 4) })
    );

    expect(logos).toEqual({
      CHI: logoDataUri(bytesOf(1, 2)),
      LAL: logoDataUri(bytesOf(3, 4)),
    });
  });

  it("requests each logo from the `/logos/<slug>.png` path on the origin", async () => {
    const seen: string[] = [];

    await loadShareLogos(
      ["CHI"],
      "https://legacyrun.example",
      fetcherFor({ CHI: bytesOf(1) }, (url) => seen.push(url))
    );

    expect(seen).toEqual(["https://legacyrun.example/logos/CHI.png"]);
  });

  // The whole point of resolving up front: Satori would fail the entire image.
  it("returns null for a logo that 404s, keeping the others", async () => {
    const logos = await loadShareLogos(
      ["CHI", "ZZZ", "LAL"],
      ORIGIN,
      fetcherFor({ CHI: bytesOf(1), LAL: bytesOf(2) })
    );

    expect(logos.ZZZ).toBeNull();
    expect(logos.CHI).not.toBeNull();
    expect(logos.LAL).not.toBeNull();
  });

  it("returns null rather than rejecting when the fetch itself throws", async () => {
    const logos = await loadShareLogos(["CHI", "LAL"], ORIGIN, async (url) => {
      if (url.includes("CHI")) throw new Error("connection refused");

      return { ok: true, arrayBuffer: async () => bytesOf(9) };
    });

    expect(logos).toEqual({ CHI: null, LAL: logoDataUri(bytesOf(9)) });
  });

  it("survives a body that fails while being read", async () => {
    const logos = await loadShareLogos(["CHI"], ORIGIN, async () => ({
      ok: true,
      arrayBuffer: async () => {
        throw new Error("aborted");
      },
    }));

    expect(logos).toEqual({ CHI: null });
  });

  // A squad can hold two players from one franchise; that is one request, not two.
  it("fetches a repeated slug only once", async () => {
    const fetcher = fetcherFor({ CHI: bytesOf(1) });
    const logos = await loadShareLogos(["CHI", "CHI", "CHI"], ORIGIN, fetcher);

    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(logos).toEqual({ CHI: logoDataUri(bytesOf(1)) });
  });

  it("answers for every slug it was given, and only those", async () => {
    const logos = await loadShareLogos(
      ["CHI", "ZZZ"],
      ORIGIN,
      fetcherFor({ CHI: bytesOf(1) })
    );

    expect(Object.keys(logos).sort()).toEqual(["CHI", "ZZZ"]);
  });

  it("handles an empty squad without calling fetch", async () => {
    const fetcher = fetcherFor({});

    expect(await loadShareLogos([], ORIGIN, fetcher)).toEqual({});
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("never rejects, even when every logo is unreachable", async () => {
    const logos = await loadShareLogos(["A1", "B2", "C3"], ORIGIN, async () => {
      throw new Error("offline");
    });

    expect(logos).toEqual({ A1: null, B2: null, C3: null });
  });
});
