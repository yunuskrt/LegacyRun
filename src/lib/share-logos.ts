import { teamLogoPath } from "@/lib/team-logo";

// Only what a logo response is read for, so a test can stand in for `fetch`.
export type LogoResponse = {
  ok: boolean;
  arrayBuffer: () => Promise<ArrayBuffer>;
};

export type LogoFetch = (url: string) => Promise<LogoResponse>;

export type ShareLogos = Record<string, string | null>;

export const logoDataUri = (bytes: ArrayBuffer): string =>
  `data:image/png;base64,${Buffer.from(bytes).toString("base64")}`;

// Satori has no `onError`, so a crest that 404s would fail the whole image.
// Anything that did not come back is `null`, which the card draws as initials.
export const loadShareLogos = async (
  slugs: readonly string[],
  origin: string,
  fetchLogo: LogoFetch
): Promise<ShareLogos> => {
  const unique = [...new Set(slugs)];

  const entries = await Promise.all(
    unique.map(async (slug) => {
      try {
        const response = await fetchLogo(
          new URL(teamLogoPath(slug), origin).href
        );

        if (!response.ok) return [slug, null] as const;

        return [slug, logoDataUri(await response.arrayBuffer())] as const;
      } catch {
        return [slug, null] as const;
      }
    })
  );

  return Object.fromEntries(entries);
};
