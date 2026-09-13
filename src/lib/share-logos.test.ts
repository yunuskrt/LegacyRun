import { describe, expect, it, vi } from "vitest";
import {
  loadShareLogos,
  logoDataUri,
  readLogoFromDisk,
} from "@/lib/share-logos";
import type { LogoReader } from "@/lib/share-logos";

const bytesOf = (...values: number[]): ArrayBuffer =>
  Uint8Array.from(values).buffer;

// Stands in for the disk: every slug in `available` has a file, the rest do not.
const readerFor = (
  available: Record<string, ArrayBuffer>,
  onRead?: (path: string) => void
): LogoReader =>
  vi.fn(async (path: string) => {
    onRead?.(path);

    const slug = path.split("/").pop()?.replace(".png", "") ?? "";
    const bytes = available[slug];

    if (!bytes) throw new Error(`ENOENT: ${path}`);

    return bytes;
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

  // The disk reader hands back a Buffer, the tests hand back an ArrayBuffer.
  it("reads a Uint8Array the same as the ArrayBuffer behind it", () => {
    const bytes = Uint8Array.from([7, 8, 9]);

    expect(logoDataUri(bytes)).toBe(logoDataUri(bytesOf(7, 8, 9)));
  });
});

describe("loadShareLogos", () => {
  it("resolves each slug to a data URI", async () => {
    const logos = await loadShareLogos(
      ["CHI", "LAL"],
      readerFor({ CHI: bytesOf(1, 2), LAL: bytesOf(3, 4) })
    );

    expect(logos).toEqual({
      CHI: logoDataUri(bytesOf(1, 2)),
      LAL: logoDataUri(bytesOf(3, 4)),
    });
  });

  it("reads each logo from the `/logos/<slug>.png` path", async () => {
    const seen: string[] = [];

    await loadShareLogos(
      ["CHI"],
      readerFor({ CHI: bytesOf(1) }, (path) => seen.push(path))
    );

    expect(seen).toEqual(["/logos/CHI.png"]);
  });

  // The whole point of resolving up front: Satori would fail the entire image.
  it("returns null for a logo that is missing, keeping the others", async () => {
    const logos = await loadShareLogos(
      ["CHI", "ZZZ", "LAL"],
      readerFor({ CHI: bytesOf(1), LAL: bytesOf(2) })
    );

    expect(logos.ZZZ).toBeNull();
    expect(logos.CHI).not.toBeNull();
    expect(logos.LAL).not.toBeNull();
  });

  it("returns null rather than rejecting when the read itself throws", async () => {
    const logos = await loadShareLogos(["CHI", "LAL"], async (path) => {
      if (path.includes("CHI")) throw new Error("EACCES");

      return bytesOf(9);
    });

    expect(logos).toEqual({ CHI: null, LAL: logoDataUri(bytesOf(9)) });
  });

  // A squad can hold two players from one franchise; that is one read, not two.
  it("reads a repeated slug only once", async () => {
    const reader = readerFor({ CHI: bytesOf(1) });
    const logos = await loadShareLogos(["CHI", "CHI", "CHI"], reader);

    expect(reader).toHaveBeenCalledTimes(1);
    expect(logos).toEqual({ CHI: logoDataUri(bytesOf(1)) });
  });

  it("answers for every slug it was given, and only those", async () => {
    const logos = await loadShareLogos(
      ["CHI", "ZZZ"],
      readerFor({ CHI: bytesOf(1) })
    );

    expect(Object.keys(logos).sort()).toEqual(["CHI", "ZZZ"]);
  });

  it("handles an empty squad without touching the disk", async () => {
    const reader = readerFor({});

    expect(await loadShareLogos([], reader)).toEqual({});
    expect(reader).not.toHaveBeenCalled();
  });

  it("never rejects, even when nothing can be read", async () => {
    const logos = await loadShareLogos(["A1", "B2", "C3"], async () => {
      throw new Error("no such directory");
    });

    expect(logos).toEqual({ A1: null, B2: null, C3: null });
  });

  // The slug now becomes a path on disk, so the guard is asserted here rather
  // than left to the decoder that happens to be the only caller today.
  it("never hands a path-like slug to the reader", async () => {
    const reader = readerFor({});
    const hostile = [
      "../../etc/passwd",
      "..%2f..%2fetc",
      "CHI/../../secret",
      "chi",
      "",
      "TOOLONGSLUG",
    ];

    const logos = await loadShareLogos(hostile, reader);

    expect(reader).not.toHaveBeenCalled();
    for (const slug of hostile) expect(logos[slug]).toBeNull();
  });
});

// The fetch this replaced proved itself by returning a 200. Reading from disk
// has no such signal, so the convention is pinned against the real files.
describe("readLogoFromDisk", () => {
  it("reads a real crest as a PNG", async () => {
    const bytes = new Uint8Array(await readLogoFromDisk("/logos/CHI.png"));

    expect(bytes.length).toBeGreaterThan(0);
    expect([...bytes.subarray(0, 4)]).toEqual([0x89, 0x50, 0x4e, 0x47]);
  });

  it("resolves every slug the share card can carry", async () => {
    const logos = await loadShareLogos(
      ["CHI", "LAL", "BOS", "GSW", "PHI"],
      readLogoFromDisk
    );

    expect(Object.values(logos).filter((uri) => uri === null)).toEqual([]);
  });

  it("rejects anything outside the logo directory", async () => {
    await expect(readLogoFromDisk("/etc/passwd")).rejects.toThrow();
    await expect(readLogoFromDisk("/logos/../../.env")).rejects.toThrow();
  });

  it("rejects a logo that is not there rather than answering empty", async () => {
    await expect(readLogoFromDisk("/logos/ZZZZ.png")).rejects.toThrow();
  });
});
