import { Readable, Transform } from 'stream';
export interface DefaultRateLimiter {
  rate: number;
  capacity: number;
  currentAmount: number;
  lastConsumeTime: number;
}
export interface IRateLimiter {
  Acquire: (want: number) => Promise<{
    ok: boolean;
    /**
     * unit: milliseconds
     */
    timeToWait: number;
  }>;
}

const minRate = 1024;
const minCapacity = 10 * 1024;

/**
 *
 * @param capacity  minValue 10KB. unit byte
 * @param rate   minValue 1KB. unit byte/s
 * @returns
 */
export function createDefaultRateLimiter(
  capacity: number,
  rate: number
): IRateLimiter {
  const realCapacity = Math.max(minCapacity, capacity);
  const realRate = Math.max(minRate, rate);
  const d: DefaultRateLimiter = {
    rate: realRate,
    capacity: realCapacity,
    currentAmount: realCapacity,
    lastConsumeTime: Date.now(),
  };

  return {
    Acquire: async (want) => {
      if (want > d.capacity) {
        want = d.capacity;
      }

      const now = Date.now();
      const increment = Math.floor(((now - d.lastConsumeTime) / 1000) * d.rate);

      if (increment + d.currentAmount > d.capacity) {
        d.currentAmount = d.capacity;
      } else {
        d.currentAmount += increment;
      }

      if (want > d.currentAmount) {
        const timeToWaitSec = (want - d.currentAmount) / d.rate;

        return { ok: false, timeToWait: Math.ceil(timeToWaitSec * 1000) };
      }

      d.lastConsumeTime = now;
      d.currentAmount = d.currentAmount - want;

      return {
        ok: true,
        timeToWait: 0,
      };
    },
  };
}

function createRateLimiterTransform(rateLimiter: IRateLimiter) {
  return new Transform({
    async transform(chunk, _encoding, callback) {
      try {
        const chunkSize = chunk.length; // 获取数据块的大小

        let finished = false;
        while (!finished) {
          const { ok, timeToWait } = await rateLimiter.Acquire(chunkSize);

          if (!ok) {
            await wait(timeToWait);
          }
          finished = ok;
        }

        this.push(chunk);
        callback();
      } catch (error: any) {
        callback(error);
      }
    },
  });
}

export function createRateLimiterStream(
  stream: NodeJS.ReadableStream | Readable,
  rateLimiter: IRateLimiter
) {
  const pipeRateLimit = createRateLimiterTransform(rateLimiter);
  return stream.pipe(pipeRateLimit);
}

export function wait(milliseconds: number) {
  return new Promise((r) => {
    setTimeout(() => r(''), milliseconds);
  });
}
