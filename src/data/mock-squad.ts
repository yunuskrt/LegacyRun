import { teamLogoPath } from "@/lib/team-logo";
import type { Squad } from "@/types/game";

// A finished draft, for building the team-review UI. Ratings are the same
// hand-set placeholders used in MOCK_DRAFT_TEAMS.
export const MOCK_SQUAD: Squad = {
  name: "All-Era Starting Five",
  formation: "TRADITIONAL",
  rating: 92,
  players: [
    {
      playerSlug: "magic-johnson",
      playerSeasonId: "magic-johnson-1987",
      name: "Magic Johnson",
      teamName: "Los Angeles Lakers",
      teamSlug: "lakers",
      teamLogo: teamLogoPath("lakers"),
      seasonYear: 1987,
      position: "PG",
      rating: 96,
    },
    {
      playerSlug: "michael-jordan",
      playerSeasonId: "michael-jordan-1996",
      name: "Michael Jordan",
      teamName: "Chicago Bulls",
      teamSlug: "bulls",
      teamLogo: teamLogoPath("bulls"),
      seasonYear: 1996,
      position: "SG",
      rating: 98,
    },
    {
      playerSlug: "lebron-james",
      playerSeasonId: "lebron-james-2013",
      name: "LeBron James",
      teamName: "Miami Heat",
      teamSlug: "heat",
      teamLogo: teamLogoPath("heat"),
      seasonYear: 2013,
      position: "SF",
      rating: 98,
    },
    {
      playerSlug: "kevin-garnett",
      playerSeasonId: "kevin-garnett-2008",
      name: "Kevin Garnett",
      teamName: "Boston Celtics",
      teamSlug: "celtics",
      teamLogo: teamLogoPath("celtics"),
      seasonYear: 2008,
      position: "PF",
      rating: 88,
    },
    {
      playerSlug: "nikola-jokic",
      playerSeasonId: "nikola-jokic-2023",
      name: "Nikola Jokić",
      teamName: "Denver Nuggets",
      teamSlug: "nuggets",
      teamLogo: teamLogoPath("nuggets"),
      seasonYear: 2023,
      position: "C",
      rating: 97,
    },
  ],
};
