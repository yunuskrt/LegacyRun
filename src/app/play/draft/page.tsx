import React from "react";
import DraftExperience from "@/components/draft/DraftExperience";
import { TRADITIONAL_SLOTS } from "@/data";

type Props = {};

const DraftPage = ({}: Props) => {
  return <DraftExperience slots={TRADITIONAL_SLOTS} />;
};

export default DraftPage;
