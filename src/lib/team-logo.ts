// The only place the `public/logos/<slug>.png` convention is written down.
export const teamLogoPath = (slug: string): string => `/logos/${slug}.png`;

// The slug becomes a filesystem path, so anything path-like is rejected.
export const TEAM_SLUG_PATTERN = /^[A-Z0-9]{2,8}$/;
