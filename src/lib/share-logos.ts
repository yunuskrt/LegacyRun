import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { TEAM_SLUG_PATTERN, teamLogoPath } from "@/lib/team-logo";

export type LogoBytes = ArrayBuffer | Uint8Array;

// The crests are read off disk rather than fetched, so nothing about the
// inbound request can steer where the bytes come from.
export type LogoReader = (path: string) => Promise<LogoBytes>;

export type ShareLogos = Record<string, string | null>;

// `Buffer.from` has no overload for the union, so the ArrayBuffer half is
// wrapped rather than widened.
export const logoDataUri = (bytes: LogoBytes): string =>
  `data:image/png;base64,${Buffer.from(
    bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
  ).toString("base64")}`;

const LOGO_ROOT = join(process.cwd(), "public");

// `public/` reaches the serverless bundle only via next.config.ts's trace; a
// failed read is a crest drawn as initials, never a failed render.
export const readLogoFromDisk: LogoReader = async (path) => {
  if (!path.startsWith("/logos/") || path.includes("..")) {
    throw new Error(`refusing to read a logo from ${path}`);
  }

  return readFile(join(LOGO_ROOT, path));
};

// Satori has no `onError`, so a crest that is missing would fail the whole image.
// Anything that did not come back is `null`, which the card draws as initials.
export const loadShareLogos = async (
  slugs: readonly string[],
  readLogo: LogoReader
): Promise<ShareLogos> => {
  const unique = [...new Set(slugs)];

  const entries = await Promise.all(
    unique.map(async (slug) => {
      // Re-asserted here rather than trusted from the decoder, because this is
      // the function that turns a slug into a path on disk.
      if (!TEAM_SLUG_PATTERN.test(slug)) return [slug, null] as const;

      try {
        return [slug, logoDataUri(await readLogo(teamLogoPath(slug)))] as const;
      } catch {
        return [slug, null] as const;
      }
    })
  );

  return Object.fromEntries(entries);
};
