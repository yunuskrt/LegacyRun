import { describe, expect, it } from "vitest";
import { apiFailure, apiSuccess } from "@/lib/api-response";

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
