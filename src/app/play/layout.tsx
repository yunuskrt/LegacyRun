import React from "react";
import RouteTransition from "@/components/play/RouteTransition";
import RunProvider from "@/components/play/RunProvider";

export default function PlayLayout({ children }: LayoutProps<"/play">) {
  return (
    <RunProvider>
      <RouteTransition>{children}</RouteTransition>
    </RunProvider>
  );
}
