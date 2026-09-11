import { NextResponse } from "next/server";
import type { ApiError, ApiResponse } from "@/types/api";

// Frozen history, so it never goes stale; errors are not cached.
export const FROZEN_HISTORY_HEADERS: Record<string, string> = {
  "Cache-Control": "max-age=31536000",
};

// Per-run state, not history — a cached response would replay another run's draw.
export const NO_STORE_HEADERS: Record<string, string> = {
  "Cache-Control": "no-store",
};

export const apiSuccess = <T>(data: T, headers?: Record<string, string>) => {
  const body: ApiResponse<T> = { success: true, data };

  return NextResponse.json(body, headers ? { headers } : undefined);
};

export const apiFailure = (error: ApiError, status: number) => {
  const body: ApiResponse<never> = { success: false, error };

  return NextResponse.json(body, { status });
};
