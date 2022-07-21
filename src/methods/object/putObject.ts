import TOSBase from '../base';
import { normalizeHeaders } from '../../utils';
import { Acl } from '../../interface';

export interface PutObjectInput {
  bucket?: string;
  key: string;
  // body is empty buffer if it's falsy
  body?: File | Blob | Buffer | ReadableStream | NodeJS.ReadableStream;

  headers?: {
    [key: string]: string | undefined;
    'content-type'?: string;
    'Content-MD5'?: string;
    'Cache-Control'?: string;
    Expires?: string;
    'x-tos-acl'?: Acl;
    'x-tos-grant-full-control'?: string;
    'x-tos-grant-read'?: string;
    'x-tos-grant-read-acp'?: string;
    'x-tos-grant-write-acp'?: string;
    'x-tos-server-side-encryption-customer-algorithm'?: string;
    'x-tos-server-side-encryption-customer-key'?: string;
    'x-tos-server-side-encryption-customer-key-md5'?: string;
    'x-tos-website-redirect-location'?: string;
    'x-tos-storage-class'?: string;
    'x-tos-server-side-encryption'?: string;
  };
}

export interface PutObjectOutput {
  'x-tos-server-side-encryption-customer-algorithm'?: string;
  'x-tos-server-side-encryption-customer-key-md5'?: string;
  'x-tos-version-id'?: string;
  'x-tos-hash-crc64ecma'?: string;
  'x-tos-server-side-encryption'?: string;
}

export async function putObject(this: TOSBase, input: PutObjectInput | string) {
  input = this.normalizeObjectInput(input);
  const headers = normalizeHeaders(input.headers);
  this.setObjectContentTypeHeader(input, headers);

  await this.fetchObject<PutObjectOutput>(
    input,
    'PUT',
    {},
    headers,
    input.body,
    { handleResponse: res => res.headers }
  );
}

export default putObject;
