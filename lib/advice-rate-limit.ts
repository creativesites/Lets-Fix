const WINDOW_MS = 5 * 60 * 1000;
const MAX_REQUESTS = 18;

type AdviceWindowRecord = {
  count: number;
  resetAt: number;
};

const globalRateLimitState = globalThis as typeof globalThis & {
  letsFixAdviceRateLimit?: Map<string, AdviceWindowRecord>;
};

function getRateLimitStore() {
  if (!globalRateLimitState.letsFixAdviceRateLimit) {
    globalRateLimitState.letsFixAdviceRateLimit = new Map();
  }

  return globalRateLimitState.letsFixAdviceRateLimit;
}

export function assertAdviceRateLimit(key: string) {
  const store = getRateLimitStore();
  const now = Date.now();
  const current = store.get(key);

  if (!current || current.resetAt <= now) {
    store.set(key, {
      count: 1,
      resetAt: now + WINDOW_MS
    });
    return;
  }

  if (current.count >= MAX_REQUESTS) {
    throw new Error("The advisor is receiving too many requests from this session. Please wait a few minutes and try again.");
  }

  current.count += 1;
  store.set(key, current);
}
