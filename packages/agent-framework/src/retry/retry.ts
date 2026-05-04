export interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  retryableErrors?: string[]; // error messages that should trigger retry
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 8000,
  retryableErrors: ['timeout', 'rate limit', '429', '503', '502', 'ECONNRESET', 'ETIMEDOUT'],
};

export function isRetryableError(error: Error, config?: RetryConfig): boolean {
  const cfg = config || DEFAULT_RETRY_CONFIG;
  const msg = error.message.toLowerCase();
  return (
    cfg.retryableErrors?.some((pattern) => msg.includes(pattern.toLowerCase())) ?? false
  );
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  config?: Partial<RetryConfig>,
): Promise<T> {
  const cfg: RetryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= cfg.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));

      if (attempt === cfg.maxRetries || !isRetryableError(lastError, cfg)) {
        throw lastError;
      }

      // Exponential backoff with jitter
      const delay = Math.min(
        cfg.baseDelayMs * Math.pow(2, attempt) + Math.random() * 500,
        cfg.maxDelayMs,
      );

      console.log(`[Retry] Attempt ${attempt + 1}/${cfg.maxRetries + 1} failed, retrying in ${Math.round(delay)}ms...`);
      await sleep(delay);
    }
  }

  throw lastError!;
}

export async function withRetryGenerator<T>(
  fn: () => AsyncGenerator<T>,
  config?: Partial<RetryConfig>,
): Promise<AsyncGenerator<T>> {
  const cfg: RetryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };

  for (let attempt = 0; attempt <= cfg.maxRetries; attempt++) {
    try {
      return fn();
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));

      if (attempt === cfg.maxRetries || !isRetryableError(error, cfg)) {
        throw error;
      }

      const delay = Math.min(
        cfg.baseDelayMs * Math.pow(2, attempt) + Math.random() * 500,
        cfg.maxDelayMs,
      );
      await sleep(delay);
    }
  }

  throw new Error('Retry exhausted');
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
