import type { ApiError, ApiResponse } from "@/types/api";

export type FetchLike = (
  input: string,
  init?: RequestInit
) => Promise<Response>;

export type ApiFetchFailure = ApiError | "UNREACHABLE";

export type ApiFetchResult<T> =
  { ok: true; data: T } | { ok: false; error: ApiFetchFailure };

const isApiError = (value: unknown): value is ApiError =>
  value === "INVALID_REQUEST" ||
  value === "NO_ELIGIBLE_TEAM" ||
  value === "QUERY_FAILED";

export const requestJson = async <T>(
  url: string,
  fetchImpl: FetchLike,
  signal?: AbortSignal
): Promise<ApiFetchResult<T>> => {
  let body: ApiResponse<T>;

  try {
    const response = await fetchImpl(url, { signal });
    body = (await response.json()) as ApiResponse<T>;
  } catch {
    // Covers transport failure and a non-JSON body alike — either way the
    // caller can only retry. An aborted request settles here rather than
    // throwing, which is what lets a superseded caller drop its own response.
    return { ok: false, error: "UNREACHABLE" };
  }

  if (body?.success) return { ok: true, data: body.data };

  return {
    ok: false,
    error: isApiError(body?.error) ? body.error : "UNREACHABLE",
  };
};
