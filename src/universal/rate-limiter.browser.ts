import { IRateLimiter } from '../interface';

export function createDefaultRateLimiter(
  _capacity: number,
  _rate: number
): IRateLimiter {
  throw Error('no implemention in browser environment');
}
export function createRateLimiterStream(
  _rateLimiter: IRateLimiter
): NodeJS.ReadableStream {
  throw Error('no implemention in browser environment');
}
