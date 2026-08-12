// Logo PNGs live in `public/logos/`, one per team slug. Keep this the only
// place the path convention is written down.
export const teamLogoPath = (slug: string): string => `/logos/${slug}.png`;
