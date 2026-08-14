// `seasonYear` is the ending year: 2008 is the 2007-08 season.
export const formatSeason = (seasonYear: number): string =>
  `${seasonYear - 1}-${String(seasonYear % 100).padStart(2, "0")}`;

export const formatSeasonShort = (seasonYear: number): string =>
  `'${String(seasonYear % 100).padStart(2, "0")}`;

// Fallback for the logo badge — `public/logos/` is empty until the PNGs land.
export const teamInitials = (teamName: string): string =>
  teamName
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((word) => word[0].toUpperCase())
    .join("");

export const abbreviatePlayerName = (name: string): string => {
  const [first, ...rest] = name.split(/\s+/).filter(Boolean);
  if (rest.length === 0) return name;
  return `${first[0]}. ${rest.join(" ")}`;
};
