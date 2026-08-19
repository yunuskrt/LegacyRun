export type Rng = () => number;

const SEED_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";

export const SEED_LENGTH = 8;

// mulberry32 over an FNV-1a hash of the seed string. Math.random can't be
// seeded, and a bracket has to reproduce from its runSeed.
export const seededRng = (seed: string): Rng => {
  let state = 2166136261 >>> 0;

  for (let index = 0; index < seed.length; index += 1) {
    state ^= seed.charCodeAt(index);
    state = Math.imul(state, 16777619) >>> 0;
  }

  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export const mintSeed = (rng: Rng = Math.random): string =>
  Array.from(
    { length: SEED_LENGTH },
    () => SEED_ALPHABET[drawIndex(SEED_ALPHABET.length, rng)]
  ).join("");

// `% total` guards an rng that can return exactly 1.
export const drawIndex = (total: number, rng: Rng): number =>
  Math.floor(rng() * total) % total;
