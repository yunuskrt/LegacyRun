import React from "react";

export default function DraftLayout({ children }: LayoutProps<"/play/draft">) {
  return (
    <div className="bg-room flex flex-1 flex-col">
      <div className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
        {children}
      </div>
    </div>
  );
}
