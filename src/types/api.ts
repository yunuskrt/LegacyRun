export type ApiError = "INVALID_REQUEST" | "NO_ELIGIBLE_TEAM" | "QUERY_FAILED";

export type ApiResponse<T> =
  { success: true; data: T } | { success: false; error: ApiError };
