import React from "react";

type Props = {
  children: React.ReactNode;
};

const DraftSectionHeading = ({ children }: Props) => {
  return (
    <h2 className="text-muted-foreground mb-4 text-sm font-semibold tracking-[0.22em] uppercase sm:text-base">
      {children}
    </h2>
  );
};

export default DraftSectionHeading;
