import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  clientKey,
  createGate,
  DATA_ROUTE_BUDGET,
  enterGate,
  leaveGate,
  MAX_TRACKED_KEYS,
  rateLimit,
  SHARE_CARD_BUDGET,
  takeToken,
} from "@/lib/rate-limit";
import type { RateLimitBudget, RateLimitWindow } from "@/lib/rate-limit";

const BUDGET: RateLimitBudget = { name: "test", limit: 3, windowMs: 60_000 };

const spend = (
  windows: Map<string, RateLimitWindow>,
  times: number,
  now = 0,
  key = "1.2.3.4"
) => {
  let last = takeToken(windows, key, BUDGET, now);
  for (let i = 1; i < times; i += 1) {
    last = takeToken(windows, key, BUDGET, now);
  }

  return last;
};

describe("takeToken", () => {
  it("allows exactly the budget inside one window", () => {
    const windows = new Map<string, RateLimitWindow>();

    expect(spend(windows, BUDGET.limit).allowed).toBe(true);
    expect(takeToken(windows, "1.2.3.4", BUDGET, 0).allowed).toBe(false);
  });

  it("keys callers separately", () => {
    const windows = new Map<string, RateLimitWindow>();

    spend(windows, BUDGET.limit + 2, 0, "1.1.1.1");

    expect(takeToken(windows, "2.2.2.2", BUDGET, 0).allowed).toBe(true);
  });

  it("opens a fresh window once the old one has passed", () => {
    const windows = new Map<string, RateLimitWindow>();

    spend(windows, BUDGET.limit + 1);

    expect(
      takeToken(windows, "1.2.3.4", BUDGET, BUDGET.windowMs - 1).allowed
    ).toBe(false);
    expect(takeToken(windows, "1.2.3.4", BUDGET, BUDGET.windowMs).allowed).toBe(
      true
    );
  });

  // A `Retry-After` that rounds to 0 tells a client to retry immediately, which
  // is the one answer guaranteed to be refused again.
  it("never reports a retry shorter than a second", () => {
    const windows = new Map<string, RateLimitWindow>();

    spend(windows, BUDGET.limit + 1);

    const decision = takeToken(
      windows,
      "1.2.3.4",
      BUDGET,
      BUDGET.windowMs - 10
    );

    expect(decision.allowed).toBe(false);
    expect(decision.retryAfterSeconds).toBeGreaterThanOrEqual(1);
  });

  it("counts down the retry as the window drains", () => {
    const windows = new Map<string, RateLimitWindow>();

    spend(windows, BUDGET.limit + 1);

    const early = takeToken(windows, "1.2.3.4", BUDGET, 1_000);
    const late = takeToken(windows, "1.2.3.4", BUDGET, 50_000);

    expect(early.retryAfterSeconds).toBeGreaterThan(late.retryAfterSeconds);
  });

  // The key comes from a header, so an attacker chooses how many there are.
  it("stays bounded when every request invents a new key", () => {
    const windows = new Map<string, RateLimitWindow>();

    for (let i = 0; i < MAX_TRACKED_KEYS * 2; i += 1) {
      takeToken(windows, `key-${i}`, BUDGET, 0);
    }

    expect(windows.size).toBeLessThanOrEqual(MAX_TRACKED_KEYS + 1);
  });

  it("sweeps finished windows before it resorts to clearing", () => {
    const windows = new Map<string, RateLimitWindow>();

    for (let i = 0; i < MAX_TRACKED_KEYS; i += 1) {
      takeToken(windows, `old-${i}`, BUDGET, 0);
    }

    // Every window above has expired by now, so the newcomer costs nothing.
    takeToken(windows, "fresh", BUDGET, BUDGET.windowMs);

    expect(windows.size).toBe(1);
    expect(windows.has("fresh")).toBe(true);
  });

  it("does not let a sweep forgive a caller still inside its window", () => {
    const windows = new Map<string, RateLimitWindow>();

    spend(windows, BUDGET.limit, 0, "noisy");
    for (let i = 0; i < MAX_TRACKED_KEYS; i += 1) {
      takeToken(windows, `other-${i}`, BUDGET, 0);
    }

    expect(takeToken(windows, "noisy", BUDGET, 1_000).allowed).toBe(false);
  });
});

describe("clientKey", () => {
  it("takes the first hop of the forwarded chain", () => {
    const headers = new Headers({
      "x-forwarded-for": "203.0.113.7, 70.41.3.18, 150.172.238.178",
    });

    expect(clientKey(headers)).toBe("203.0.113.7");
  });

  it("falls back to x-real-ip", () => {
    expect(clientKey(new Headers({ "x-real-ip": "203.0.113.9" }))).toBe(
      "203.0.113.9"
    );
  });

  it("buckets callers with no forwarding header together", () => {
    expect(clientKey(new Headers())).toBe("unknown");
    expect(clientKey(new Headers({ "x-forwarded-for": "  " }))).toBe("unknown");
  });
});

describe("rateLimit", () => {
  // Spending the larger budget first is what makes this discriminate: a shared
  // window would already be past the card's smaller limit, while the reverse
  // order stays under the data limit and passes either way.
  it("gives each budget its own allowance for the same caller", () => {
    const headers = new Headers({ "x-forwarded-for": "198.51.100.4" });

    for (let i = 0; i < DATA_ROUTE_BUDGET.limit; i += 1) {
      rateLimit(headers, DATA_ROUTE_BUDGET);
    }

    expect(rateLimit(headers, DATA_ROUTE_BUDGET).allowed).toBe(false);
    expect(rateLimit(headers, SHARE_CARD_BUDGET).allowed).toBe(true);
  });

  it("still throttles the caller it is given", () => {
    const headers = new Headers({ "x-forwarded-for": "198.51.100.5" });

    for (let i = 0; i < SHARE_CARD_BUDGET.limit; i += 1) {
      expect(rateLimit(headers, SHARE_CARD_BUDGET).allowed).toBe(true);
    }

    const denied = rateLimit(headers, SHARE_CARD_BUDGET);

    expect(denied.allowed).toBe(false);
    expect(denied.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("leaves a different caller untouched", () => {
    const noisy = new Headers({ "x-forwarded-for": "198.51.100.6" });
    const quiet = new Headers({ "x-forwarded-for": "198.51.100.7" });

    for (let i = 0; i < SHARE_CARD_BUDGET.limit + 5; i += 1) {
      rateLimit(noisy, SHARE_CARD_BUDGET);
    }

    expect(rateLimit(quiet, SHARE_CARD_BUDGET).allowed).toBe(true);
  });
});

describe("budgets", () => {
  // "Users should not be overwhelmed" is a requirement on these numbers: a real
  // run spends ~15 data calls over minutes and at most 3 renders per dialog.
  it("leave room for several times the fastest real run", () => {
    expect(DATA_ROUTE_BUDGET.limit).toBeGreaterThanOrEqual(60);
    expect(SHARE_CARD_BUDGET.limit).toBeGreaterThanOrEqual(20);
    expect(DATA_ROUTE_BUDGET.windowMs).toBe(60_000);
    expect(SHARE_CARD_BUDGET.windowMs).toBe(60_000);
  });
});

describe("concurrency gate", () => {
  it("admits up to its limit and turns the next caller away", () => {
    const gate = createGate(2);

    expect(enterGate(gate)).toBe(true);
    expect(enterGate(gate)).toBe(true);
    expect(enterGate(gate)).toBe(false);
  });

  it("frees the slot when a render finishes", () => {
    const gate = createGate(1);

    enterGate(gate);
    expect(enterGate(gate)).toBe(false);

    leaveGate(gate);
    expect(enterGate(gate)).toBe(true);
  });

  // A route that leaves the gate in `finally` can unwind more than it entered.
  it("never counts below empty", () => {
    const gate = createGate(1);

    leaveGate(gate);
    leaveGate(gate);

    expect(gate.inFlight).toBe(0);
    expect(enterGate(gate)).toBe(true);
    expect(enterGate(gate)).toBe(false);
  });
});

// The limiter only protects the routes that actually call it, and this repo
// does not test routes — so what a route wires up is pinned by reading it.
describe("route coverage", () => {
  const API_DIR = join(process.cwd(), "src/app/api");
  const SHARE_CARD = join("share", "card", "route.ts");

  const routes = readdirSync(API_DIR, {
    recursive: true,
    encoding: "utf8",
  }).filter((entry) => entry.endsWith("route.ts"));

  const dataRoutes = routes.filter((entry) => entry !== SHARE_CARD);

  const sourceOf = (route: string) =>
    readFileSync(join(API_DIR, route), "utf8");

  it("finds the routes it means to check", () => {
    expect(dataRoutes.length).toBeGreaterThan(0);
    expect(routes).toContain(SHARE_CARD);
  });

  // A new data route added without this ships unthrottled and nothing says so.
  // Matching the call and not the name is the point: deleting the call leaves
  // the import behind, and a bare `includes` would still be satisfied by it.
  it("throttles every Neon-backed data route", () => {
    for (const route of dataRoutes) {
      expect(
        /rateLimit\(\s*request\.headers\s*,\s*DATA_ROUTE_BUDGET\s*\)/.test(
          sourceOf(route)
        ),
        `${route} never calls rateLimit(request.headers, DATA_ROUTE_BUDGET) — every data route must spend that budget.`
      ).toBe(true);
    }
  });

  // Spending the budget and ignoring the answer throttles nothing.
  it("turns a spent budget into a 429 on every data route", () => {
    for (const route of dataRoutes) {
      expect(
        /if\s*\(!limit\.allowed\)\s*\{\s*return apiRateLimited\(/.test(
          sourceOf(route)
        ),
        `${route} calls rateLimit but never returns apiRateLimited on a denial.`
      ).toBe(true);
    }
  });

  it("gives the share card its own budget rather than the data one", () => {
    const source = sourceOf(SHARE_CARD);

    expect(
      /rateLimit\(\s*request\.headers\s*,\s*SHARE_CARD_BUDGET\s*\)/.test(
        source
      ),
      "the card route never calls rateLimit with its own budget."
    ).toBe(true);
    expect(
      source.includes("DATA_ROUTE_BUDGET"),
      "the card render is far more expensive than a query and must not share its allowance."
    ).toBe(false);
  });

  // The one failure that does not announce itself: a slot taken and never given
  // back leaves the route permanently wedged after two failed renders, and only
  // a restart clears it.
  it("releases the render slot on every path out of the share card route", () => {
    const source = sourceOf(SHARE_CARD);

    expect(source).toContain("enterGate");
    expect(
      /finally\s*\{[^}]*leaveGate/.test(source),
      "leaveGate must sit in a `finally` — a render that throws otherwise keeps its slot forever."
    ).toBe(true);
  });
});
