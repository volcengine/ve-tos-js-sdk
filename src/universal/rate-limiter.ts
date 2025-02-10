import * as moduleBrowser from './rate-limiter.browser';
import * as moduleNode from '../nodejs/rate-limiter';
import { IRateLimiter } from '../interface';

interface RateLimiterModule {
  createDefaultRateLimiter(capacity: number, rate: number): IRateLimiter;
  createRateLimiterStream(
    stream: NodeJS.ReadableStream,
    rateLimiter: IRateLimiter
  ): NodeJS.ReadableStream;
}

let rateLimiter = null as unknown as RateLimiterModule;
if (process.env.TARGET_ENVIRONMENT === 'node') {
  rateLimiter = moduleNode as unknown as RateLimiterModule;
} else {
  rateLimiter = moduleBrowser as unknown as RateLimiterModule;
}

const { createDefaultRateLimiter, createRateLimiterStream } = rateLimiter;

export { createDefaultRateLimiter, createRateLimiterStream };
export type { IRateLimiter };
