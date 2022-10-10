import TOSBase from '../base';
import { normalizeHeadersKey } from '../../utils';
import { Acl } from '../../interface';

export interface AppendObjectInput {
  bucket?: string;
  key: string;
  offset: number;
  // body is empty buffer if it's falsy
  body?: File | Blob | Buffer | NodeJS.ReadableStream;

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
  const headers = normalizeHeadersKey(input.headers);
  this.setObjectContentTypeHeader(input, headers);

  await this.fetchObject<AppendObjectOutput>(
    input,
    'PUT',
    { append: '', offset: input.offset },
    headers,
    input.body,
    { handleResponse: res => res.headers }
  );
}

export default appendObject;
