import { describe, expect, it, vi } from "vitest";
import {
  DRAFT_FETCH_MESSAGE,
  draftTeamUrl,
  requestDraftTeam,
  rerollRequest,
  type DraftRequest,
} from "@/lib/draft-client";
import type { FetchLike } from "@/lib/api-client";
import type { RerollKind } from "@/lib/draft";
import type { ApiError } from "@/types/api";
import type { DraftTeam } from "@/types/game";

const team: DraftTeam = {
  teamSeasonId: "CHI-1996",
  teamName: "Chicago Bulls",
  teamSlug: "CHI",
  teamLogo: "/logos/CHI.png",
  teamRating: 91,
  seasonYear: 1996,
  players: [],
};

const respondWith = (body: unknown): FetchLike =>
  vi.fn().mockResolvedValue({ json: async () => body });

const request = (request: DraftRequest, fetchImpl: FetchLike) =>
  requestDraftTeam(request, fetchImpl);

describe("rerollRequest", () => {
  it("anchors Another Team on the team currently on the board", () => {
    expect(rerollRequest("ANOTHER_TEAM", "CHI-1996")).toEqual({
      mode: "another-team",
      exclude: "CHI-1996",
    });
  });

  it("anchors Another Season on the team currently on the board", () => {
    expect(rerollRequest("ANOTHER_SEASON", "CHI-1996")).toEqual({
      mode: "another-season",
      exclude: "CHI-1996",
    });
  });

  it("draws Skip Round unanchored, ignoring the current team", () => {
    expect(rerollRequest("SKIP_ROUND", "CHI-1996")).toEqual({ mode: "random" });
  });

  it("sends Skip Round to the same url as Get Random Team", () => {
    expect(draftTeamUrl(rerollRequest("SKIP_ROUND", "CHI-1996"))).toBe(
      draftTeamUrl({ mode: "random" })
    );
  });

  it("gives each reroll button a distinct request", () => {
    const kinds: RerollKind[] = [
      "ANOTHER_TEAM",
      "ANOTHER_SEASON",
      "SKIP_ROUND",
    ];
    const urls = kinds.map((kind) =>
      draftTeamUrl(rerollRequest(kind, "CHI-1996"))
    );

    expect(new Set(urls).size).toBe(kinds.length);
  });
});

describe("draftTeamUrl", () => {
  it("sends the random draw with no query string at all", () => {
    expect(draftTeamUrl({ mode: "random" })).toBe("/api/draft/team");
  });

  it("anchors another-team on the current team-season", () => {
    expect(draftTeamUrl({ mode: "another-team", exclude: "CHI-1996" })).toBe(
      "/api/draft/team?mode=another-team&exclude=CHI-1996"
    );
  });

  it("anchors another-season on the current team-season", () => {
    expect(draftTeamUrl({ mode: "another-season", exclude: "CHI-1996" })).toBe(
      "/api/draft/team?mode=another-season&exclude=CHI-1996"
    );
  });

  it("encodes an anchor that would otherwise break the query string", () => {
    expect(draftTeamUrl({ mode: "another-team", exclude: "A&B=1" })).toBe(
      "/api/draft/team?mode=another-team&exclude=A%26B%3D1"
    );
  });
});

describe("requestDraftTeam", () => {
  it("unwraps a successful envelope", async () => {
    await expect(
      request({ mode: "random" }, respondWith({ success: true, data: team }))
    ).resolves.toEqual({ ok: true, team });
  });

  it("requests the url the mode maps to", async () => {
    const fetchImpl = respondWith({ success: true, data: team });

    await request({ mode: "another-season", exclude: "CHI-1996" }, fetchImpl);

    expect(fetchImpl).toHaveBeenCalledWith(
      "/api/draft/team?mode=another-season&exclude=CHI-1996",
      { signal: undefined }
    );
  });

  it("passes each error code straight through", async () => {
    const errors: ApiError[] = [
      "INVALID_REQUEST",
      "NO_ELIGIBLE_TEAM",
      "QUERY_FAILED",
    ];

    for (const error of errors) {
      await expect(
        request({ mode: "random" }, respondWith({ success: false, error }))
      ).resolves.toEqual({ ok: false, error });
    }
  });

  it("reports a transport failure as unreachable", async () => {
    const fetchImpl: FetchLike = vi
      .fn()
      .mockRejectedValue(new Error("network down"));

    await expect(request({ mode: "random" }, fetchImpl)).resolves.toEqual({
      ok: false,
      error: "UNREACHABLE",
    });
  });

  it("reports a non-JSON body as unreachable rather than throwing", async () => {
    const fetchImpl: FetchLike = vi.fn().mockResolvedValue({
      json: async () => {
        throw new Error("Unexpected token <");
      },
    });

    await expect(request({ mode: "random" }, fetchImpl)).resolves.toEqual({
      ok: false,
      error: "UNREACHABLE",
    });
  });

  it("falls back to unreachable on an unrecognized error code", async () => {
    await expect(
      request(
        { mode: "random" },
        respondWith({ success: false, error: "TEAPOT" })
      )
    ).resolves.toEqual({ ok: false, error: "UNREACHABLE" });
  });

  // The race guard depends on this: an aborted request must resolve, not throw,
  // so the caller can drop it by checking its own signal.
  it("resolves rather than throwing when the request is aborted", async () => {
    const controller = new AbortController();
    const fetchImpl: FetchLike = vi.fn().mockImplementation(() => {
      controller.abort();
      return Promise.reject(
        new DOMException("The operation was aborted.", "AbortError")
      );
    });

    await expect(
      requestDraftTeam({ mode: "random" }, fetchImpl, controller.signal)
    ).resolves.toEqual({ ok: false, error: "UNREACHABLE" });
  });

  it("forwards the abort signal it is given", async () => {
    const fetchImpl = respondWith({ success: true, data: team });
    const controller = new AbortController();

    await requestDraftTeam({ mode: "random" }, fetchImpl, controller.signal);

    expect(fetchImpl).toHaveBeenCalledWith("/api/draft/team", {
      signal: controller.signal,
    });
  });
});

describe("DRAFT_FETCH_MESSAGE", () => {
  it("covers every failure the fetcher can return", () => {
    expect(Object.keys(DRAFT_FETCH_MESSAGE).sort()).toEqual([
      "INVALID_REQUEST",
      "NO_ELIGIBLE_TEAM",
      "QUERY_FAILED",
      "UNREACHABLE",
    ]);

    for (const message of Object.values(DRAFT_FETCH_MESSAGE)) {
      expect(message.length).toBeGreaterThan(0);
    }
  });
});
