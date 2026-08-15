import React from "react";
import DraftExperience from "@/components/draft/DraftExperience";
import { MOCK_DRAFT_TEAMS, TRADITIONAL_SLOTS } from "@/data";

type Props = {};

// Phase 6 runs the draft on runtime state over the local fixtures — the Phase 11
// query API replaces this import in Phase 13.
const DraftPage = ({}: Props) => {
  return <DraftExperience teams={MOCK_DRAFT_TEAMS} slots={TRADITIONAL_SLOTS} />;
};

export default DraftPage;
