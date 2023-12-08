import TOSBase from '../base';
import {
  fillRequestHeaders,
  isReadable,
  normalizeHeadersKey,
} from '../../utils';
import { Acl } from '../../interface';
import { IRateLimiter, createRateLimiterStream } from '../../rate-limiter';
import { isValidRateLimiter } from './utils';

export interface AppendObjectInput {
  bucket?: string;
  key: string;
  offset: number;
  // body is empty buffer if it's falsy
  body?: File | Blob | Buffer | NodeJS.ReadableStream;

  /**
   * unit: bit/s
   * server side traffic limit
   **/
  trafficLimit?: number;
  /**
   * only works for nodejs environment
   */
  rateLimiter?: IRateLimiter;
  headers?: {
    [key: string]: string | undefined;
    'Cache-Control'?: string;
    'x-tos-acl'?: Acl;
    'x-tos-grant-full-control'?: string;
    'x-tos-grant-read'?: string;
    'x-tos-grant-read-acp'?: string;
    'x-tos-grant-write-acp'?: string;
    'x-tos-website-redirect-location'?: string;
    'x-tos-storage-class'?: string;
  };
}

export interface AppendObjectOutput {
  'x-tos-version-id'?: string;
  'x-tos-hash-crc64ecma'?: string;
  'x-tos-next-append-offset'?: string;
}

export async function appendObject(
  this: TOSBase,
  input: AppendObjectInput | string
) {
  input = this.normalizeObjectInput(input);
  fillRequestHeaders(input, ['trafficLimit']);
  const headers = normalizeHeadersKey(input.headers);
  this.setObjectContentTypeHeader(input, headers);
  if (process.env.TARGET_ENVIRONMENT === 'node' && isReadable(input.body)) {
    if (input.rateLimiter && isValidRateLimiter(input.rateLimiter)) {
      input.body = createRateLimiterStream(input.body, input.rateLimiter);
    }
  }

  return await this._fetchObject<AppendObjectOutput>(
    input,
    'PUT',
    { append: '', offset: input.offset },
    headers,
    input.body,
    { handleResponse: (res) => res.headers }
  );
}

export default appendObject;
