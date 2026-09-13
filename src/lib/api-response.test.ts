import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  apiFailure,
  apiRateLimited,
  apiSuccess,
  FROZEN_HISTORY_HEADERS,
  NO_STORE_HEADERS,
} from "@/lib/api-response";

describe("apiSuccess", () => {
  it("wraps the payload in the success envelope with a 200", async () => {
    const response = apiSuccess({ teamSeasonId: "CHI-1996" });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: { teamSeasonId: "CHI-1996" },
    });
  });

  it("applies the caching headers it is given", () => {
    const response = apiSuccess("ok", { "Cache-Control": "no-store" });

    expect(response.headers.get("cache-control")).toBe("no-store");
  });
});

describe("cache headers", () => {
  const API_DIR = join(process.cwd(), "src/app/api");

  // The PNG route's `public, …, immutable` is a different header for a different
  // kind of response, and only coincidentally shares the max-age.
  const SHARE_CARD = join("share", "card", "route.ts");

  const dataRoutes = readdirSync(API_DIR, {
    recursive: true,
    encoding: "utf8",
  }).filter((entry) => entry.endsWith("route.ts") && entry !== SHARE_CARD);

  it("carries the values the routes used to inline", () => {
    expect(FROZEN_HISTORY_HEADERS["Cache-Control"]).toBe("max-age=31536000");
    expect(NO_STORE_HEADERS["Cache-Control"]).toBe("no-store");
  });

  // Defined once is only true while nothing re-inlines it — this is what stops the drift.
  it("are never written as a literal in a data route", () => {
    expect(dataRoutes.length).toBeGreaterThan(0);

    for (const route of dataRoutes) {
      const source = readFileSync(join(API_DIR, route), "utf8");

      expect(
        source.includes("Cache-Control"),
        `${route} inlines a Cache-Control header — import it from @/lib/api-response instead.`
      ).toBe(false);
    }
  });

  // A shared constant stops the values drifting, not a route reaching for the wrong one.
  const EXPECTED: Record<
    string,
    "FROZEN_HISTORY_HEADERS" | "NO_STORE_HEADERS"
  > = {
    [join("draft", "team", "route.ts")]: "NO_STORE_HEADERS",
    [join("draft", "team", "[teamSeasonId]", "route.ts")]:
      "FROZEN_HISTORY_HEADERS",
    [join("tournament", "bracket", "route.ts")]: "NO_STORE_HEADERS",
    [join("tournament", "match-data", "route.ts")]: "FROZEN_HISTORY_HEADERS",
  };

  // A new data route has to declare which one it is rather than inheriting a default.
  it("covers every data route", () => {
    expect([...dataRoutes].sort()).toEqual(Object.keys(EXPECTED).sort());
  });

  // Year-caching a randomised draw would serve one team+season for the life of the cache.
  it("caches only the routes that return frozen history", () => {
    for (const [route, expected] of Object.entries(EXPECTED)) {
      const source = readFileSync(join(API_DIR, route), "utf8");
      const wrong =
        expected === "NO_STORE_HEADERS"
          ? "FROZEN_HISTORY_HEADERS"
          : "NO_STORE_HEADERS";

      expect(source, `${route} should send ${expected}`).toContain(expected);
      expect(source.includes(wrong), `${route} sends ${wrong}`).toBe(false);
    }
  });
});

describe("apiFailure", () => {
  it("returns the error code and status without a data field", async () => {
    const response = apiFailure("NO_ELIGIBLE_TEAM", 404);

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: "NO_ELIGIBLE_TEAM",
    });
  });

  it("never leaks anything beyond the error code", async () => {
    const body = await apiFailure("QUERY_FAILED", 500).json();

    expect(Object.keys(body)).toEqual(["success", "error"]);
  });
});

describe("apiRateLimited", () => {
  it("answers 429 in the same envelope as every other failure", async () => {
    const response = apiRateLimited(30);

    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: "RATE_LIMITED",
    });
  });

  it("tells the caller when to come back", () => {
    expect(apiRateLimited(30).headers.get("retry-after")).toBe("30");
  });

  // A cached 429 would be replayed to everyone behind the same cache.
  it("is never cached", () => {
    expect(apiRateLimited(1).headers.get("cache-control")).toBe("no-store");
  });
});
