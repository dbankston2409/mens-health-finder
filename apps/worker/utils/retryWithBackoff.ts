/**
 * Utility for retrying operations with exponential backoff
 */

export interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  shouldRetry?: (error: any) => boolean;
  onRetry?: (attempt: number, error: any) => void;
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelayMs = 1000,
    maxDelayMs = 60000,
    shouldRetry = () => true,
    onRetry
  } = options;

  let lastError: any;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if we should retry this error
      if (!shouldRetry(error)) {
        throw error;
      }

      // Don't retry if this is the last attempt
      if (attempt === maxRetries - 1) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        initialDelayMs * Math.pow(2, attempt),
        maxDelayMs
      );

      // Call retry callback if provided
      if (onRetry) {
        onRetry(attempt + 1, error);
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: any): boolean {
  // Network errors
  if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
    return true;
  }

  // HTTP errors that are retryable
  if (error.status === 429 || error.status === 503 || error.status >= 500) {
    return true;
  }

  // Rate limit errors
  if (error.message?.includes('rate limit') || error.message?.includes('quota')) {
    return true;
  }

  // Timeout errors
  if (error.message?.includes('timeout') || error.message?.includes('timed out')) {
    return true;
  }

  return false;
}

/**
 * Retry with specific strategies for different services
 */
export const retryStrategies = {
  // Google Places API retry strategy
  googlePlaces: {
    maxRetries: 3,
    initialDelayMs: 2000,
    shouldRetry: (error: any) => {
      // Don't retry if place not found
      if (error.status === 404) return false;
      return isRetryableError(error);
    }
  },

  // Claude API retry strategy
  claude: {
    maxRetries: 3,
    initialDelayMs: 5000,
    maxDelayMs: 30000,
    shouldRetry: (error: any) => {
      // Don't retry if content was flagged
      if (error.message?.includes('content policy')) return false;
      return isRetryableError(error);
    }
  },

  // Website scraping retry strategy
  websiteScraping: {
    maxRetries: 2,
    initialDelayMs: 3000,
    shouldRetry: (error: any) => {
      // Don't retry if website doesn't exist
      if (error.status === 404 || error.code === 'ENOTFOUND') return false;
      return isRetryableError(error);
    }
  }
};