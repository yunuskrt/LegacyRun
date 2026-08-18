import React from "react";
import RunProvider from "@/components/play/RunProvider";

export default function PlayLayout({ children }: LayoutProps<"/play">) {
  return <RunProvider>{children}</RunProvider>;
}
