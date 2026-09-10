import React from "react";
import BracketSection from "@/components/landing/BracketSection";
import ClosingSection from "@/components/landing/ClosingSection";
import DraftSection from "@/components/landing/DraftSection";
import HeroSection from "@/components/landing/HeroSection";
import PoolSection from "@/components/landing/PoolSection";

type Props = {};

const Home = ({}: Props) => {
  return (
    <main className="flex-1">
      <HeroSection />
      <PoolSection />
      <DraftSection />
      <BracketSection />
      <ClosingSection />
    </main>
  );
};

export default Home;
