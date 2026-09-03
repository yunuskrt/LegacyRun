import { describe, expect, it, vi } from "vitest";
import { requestJson } from "@/lib/api-client";
import type { FetchLike } from "@/lib/api-client";

const respondWith = (body: unknown): FetchLike =>
  vi.fn().mockResolvedValue({ json: async () => body });

describe("requestJson", () => {
  it("unwraps a successful envelope", async () => {
    const result = await requestJson<{ id: string }>(
      "/api/thing",
      respondWith({ success: true, data: { id: "CHI-1996" } })
    );

    expect(result).toEqual({ ok: true, data: { id: "CHI-1996" } });
  });

  it("passes the url and the abort signal through to fetch", async () => {
    const fetchImpl = respondWith({ success: true, data: null });
    const controller = new AbortController();

    await requestJson("/api/thing?mode=random", fetchImpl, controller.signal);

    expect(fetchImpl).toHaveBeenCalledWith("/api/thing?mode=random", {
      signal: controller.signal,
    });
  });

  it("carries a known api error through untouched", async () => {
    const result = await requestJson(
      "/api/thing",
      respondWith({ success: false, error: "NO_ELIGIBLE_TEAM" })
    );

    expect(result).toEqual({ ok: false, error: "NO_ELIGIBLE_TEAM" });
  });

  // The error is a value off the wire, so an unrecognized one must not reach
  // the caller's message record — every consumer keys a toast off it.
  it("normalizes an unrecognized error to UNREACHABLE", async () => {
    const result = await requestJson(
      "/api/thing",
      respondWith({ success: false, error: "SOMETHING_ELSE" })
    );

    expect(result).toEqual({ ok: false, error: "UNREACHABLE" });
  });

  it("treats a transport failure as UNREACHABLE", async () => {
    const fetchImpl: FetchLike = () => Promise.reject(new Error("offline"));

    await expect(requestJson("/api/thing", fetchImpl)).resolves.toEqual({
      ok: false,
      error: "UNREACHABLE",
    });
  });

  // An aborted request has to settle rather than throw — a superseded caller
  // drops its own response by checking its signal after awaiting.
  it("resolves rather than throwing when the request is aborted", async () => {
    const fetchImpl: FetchLike = () =>
      Promise.reject(new DOMException("Aborted", "AbortError"));

    await expect(requestJson("/api/thing", fetchImpl)).resolves.toEqual({
      ok: false,
      error: "UNREACHABLE",
    });
  });

  it("treats a non-JSON body as UNREACHABLE", async () => {
    const fetchImpl: FetchLike = async () =>
      ({
        json: async () => {
          throw new SyntaxError("Unexpected token <");
        },
      }) as unknown as Response;

    await expect(requestJson("/api/thing", fetchImpl)).resolves.toEqual({
      ok: false,
      error: "UNREACHABLE",
    });
  });

  it("treats an empty body as UNREACHABLE", async () => {
    const result = await requestJson("/api/thing", respondWith(undefined));

    expect(result).toEqual({ ok: false, error: "UNREACHABLE" });
  });
});
