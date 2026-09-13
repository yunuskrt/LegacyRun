// The list is the type, so a new code cannot be added to one and missed by the
// other — `isApiError` narrows against this at runtime.
export const API_ERRORS = [
  "INVALID_REQUEST",
  "NO_ELIGIBLE_TEAM",
  "QUERY_FAILED",
  "RATE_LIMITED",
] as const;

export type ApiError = (typeof API_ERRORS)[number];

export type ApiResponse<T> =
  { success: true; data: T } | { success: false; error: ApiError };
