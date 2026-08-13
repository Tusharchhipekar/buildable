export function createRateLimiter(minIntervalMs = 20_000, maxRetries = 4) {
  const RETRY_BACKOFF_MS = [10_000, 20_000, 40_000, 60_000];
  let queue: Promise<void> = Promise.resolve();
  let lastCallAt = 0;

  function wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function throttle(): Promise<void> {
    const run = queue.then(async () => {
      const elapsed = Date.now() - lastCallAt;
      if (elapsed < minIntervalMs) {
        await wait(minIntervalMs - elapsed);
      }
      lastCallAt = Date.now();
    });
    queue = run;
    await run;
  }

  function isRetryableError(err: unknown): boolean {
    const message = err instanceof Error ? err.message : String(err);
    const isTimeout =
      (err instanceof DOMException && err.name === "TimeoutError") ||
      message.toLowerCase().includes("timed out");
    return (
      isTimeout ||
      message.includes("429") ||
      message.toLowerCase().includes("rate limit") ||
      message.toLowerCase().includes("rate_limited")
    );
  }

  async function callWithRateLimit<T>(fn: () => Promise<T>): Promise<T> {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      await throttle();
      try {
        return await fn();
      } catch (err) {
        if (isRetryableError(err) && attempt < maxRetries) {
          const backoff = RETRY_BACKOFF_MS[attempt] ?? 60_000;
          console.warn(
            `Model provider call failed (${err instanceof Error ? err.message : String(err)}), attempt ${attempt + 1}/${maxRetries + 1}, retrying in ${backoff / 1000}s...`,
          );
          await wait(backoff);
          continue;
        }
        throw err;
      }
    }
    throw new Error("callWithRateLimit: exhausted retries");
  }

  return { callWithRateLimit };
}

export const { callWithRateLimit } = createRateLimiter(20_000);
