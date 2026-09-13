// `X-Forwarded-For` is caller-supplied, so these budgets bound accidents and
// casual abuse only — the gate below is what holds against a hostile caller.

export type RateLimitBudget = {
  name: string;
  limit: number;
  windowMs: number;
};

export type RateLimitWindow = {
  count: number;
  resetAt: number;
};

export type RateLimitDecision = {
  allowed: boolean;
  retryAfterSeconds: number;
};

const MINUTE_MS = 60_000;

// A full run spends ~10-15 draft-team calls plus one bracket and up to four
// match-data calls, over several minutes. This sits about 4x over that.
export const DATA_ROUTE_BUDGET: RateLimitBudget = {
  name: "data-route",
  limit: 60,
  windowMs: MINUTE_MS,
};

// The dialog renders once per open and once per shape change, three shapes.
export const SHARE_CARD_BUDGET: RateLimitBudget = {
  name: "share-card",
  limit: 20,
  windowMs: MINUTE_MS,
};

// Every distinct key costs an entry, and the key comes from a header, so the
// store is swept of finished windows once it grows past this.
export const MAX_TRACKED_KEYS = 5000;

const ALLOWED: RateLimitDecision = { allowed: true, retryAfterSeconds: 0 };

export const clientKey = (headers: Headers): string => {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  // Without a proxy every caller shares one bucket, which is what local
  // development wants and what production never sees.
  return forwarded || headers.get("x-real-ip")?.trim() || "unknown";
};

// Dropping finished windows usually suffices; a flood of live ones empties the
// store instead, so the limiter fails open rather than growing without bound.
const sweep = (windows: Map<string, RateLimitWindow>, now: number): void => {
  for (const [key, window] of windows) {
    if (now >= window.resetAt) windows.delete(key);
  }

  if (windows.size > MAX_TRACKED_KEYS) windows.clear();
};

export const takeToken = (
  windows: Map<string, RateLimitWindow>,
  key: string,
  budget: RateLimitBudget,
  now: number
): RateLimitDecision => {
  const window = windows.get(key);

  if (!window || now >= window.resetAt) {
    if (!window && windows.size >= MAX_TRACKED_KEYS) sweep(windows, now);

    windows.set(key, { count: 1, resetAt: now + budget.windowMs });

    return ALLOWED;
  }

  window.count += 1;

  if (window.count <= budget.limit) return ALLOWED;

  return {
    allowed: false,
    retryAfterSeconds: Math.max(1, Math.ceil((window.resetAt - now) / 1000)),
  };
};

// Namespaced by budget so the card and the data routes cannot spend each
// other's allowance. Module scope means per instance — see current-feature.md.
const windows = new Map<string, RateLimitWindow>();

export const rateLimit = (
  headers: Headers,
  budget: RateLimitBudget,
  now: number = Date.now()
): RateLimitDecision =>
  takeToken(windows, `${budget.name}:${clientKey(headers)}`, budget, now);

// The share card rasterises up to 1080x1920 through satori, so what needs
// bounding is simultaneous renders, not requests.
export type ConcurrencyGate = {
  inFlight: number;
  max: number;
};

export const createGate = (max: number): ConcurrencyGate => ({
  inFlight: 0,
  max,
});

export const enterGate = (gate: ConcurrencyGate): boolean => {
  if (gate.inFlight >= gate.max) return false;

  gate.inFlight += 1;

  return true;
};

export const leaveGate = (gate: ConcurrencyGate): void => {
  gate.inFlight = Math.max(0, gate.inFlight - 1);
};
