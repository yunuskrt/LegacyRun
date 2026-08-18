import { NextResponse } from "next/server";
import type { ApiError, ApiResponse } from "@/types/api";

export const apiSuccess = <T>(data: T, headers?: Record<string, string>) => {
  const body: ApiResponse<T> = { success: true, data };

  return NextResponse.json(body, headers ? { headers } : undefined);
};

export const apiFailure = (error: ApiError, status: number) => {
  const body: ApiResponse<never> = { success: false, error };

  return NextResponse.json(body, { status });
};
