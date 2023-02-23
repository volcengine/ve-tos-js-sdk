import TOSBase from '../base';
import { fillRequestHeaders, normalizeHeadersKey } from '../../utils';
import { Acl } from '../../interface';
import { StorageClassType } from '../../TosExportEnum';

export interface AppendObjectInput {
  bucket?: string;
  key: string;
  offset: number;
  // body is empty buffer if it's falsy
  body?: File | Blob | Buffer | NodeJS.ReadableStream;

  contentLength: number;
  cacheControl?: string;
  contentDisposition?: string;
  contentEncoding?: string;
  contentLanguage?: string;
  contentType?: string;
  expires?: Date;

  acl?: Acl;
  grantFullControl?: string;
  grantRead?: string;
  grantReadAcp?: string;
  grantWriteAcp?: string;

  meta?: Record<string, string>;
  websiteRedirectLocation?: string;
  storageClass?: StorageClassType;

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
  input.headers = headers;
  fillRequestHeaders(input, [
    'cacheControl',
    'contentDisposition',
    'contentEncoding',
    'contentLanguage',
    'contentType',
    'expires',

    'acl',
    'grantFullControl',
    'grantRead',
    'grantReadAcp',
    'grantWriteAcp',

    'meta',
    'websiteRedirectLocation',
    'storageClass',
  ]);
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
