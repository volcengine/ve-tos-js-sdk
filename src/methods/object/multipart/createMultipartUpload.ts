import TOSBase from '../../base';
import { fillRequestHeaders, normalizeHeadersKey } from '../../../utils';
import { Acl } from '../../../interface';
import { StorageClassType } from '../../../TosExportEnum';

export interface CreateMultipartUploadInput {
  bucket?: string;
  key: string;

  encodingType?: string;
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

  ssecAlgorithm?: string;
  ssecKey?: string;
  ssecKeyMD5?: string;

  serverSideEncryption?: string;

  meta?: Record<string, string>;
  websiteRedirectLocation?: string;
  storageClass?: StorageClassType;

  headers?: {
    [key: string]: string | undefined;
    'encoding-type'?: string;
    'Content-Disposition'?: string;
    'x-tos-acl'?: Acl;
    'content-type'?: string;
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

export interface CreateMultipartUploadOutput {
  UploadId: string;
  Bucket: string;
  Key: string;
  EncodingType?: string;
}

export async function createMultipartUpload(
  this: TOSBase,
  input: CreateMultipartUploadInput | string
) {
  input = this.normalizeObjectInput(input);
  const headers = normalizeHeadersKey(input.headers);
  input.headers = headers;
  fillRequestHeaders(input, [
    'encodingType',
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

    'ssecAlgorithm',
    'ssecKey',
    'ssecKeyMD5',
    'serverSideEncryption',

    'meta',
    'websiteRedirectLocation',
    'storageClass',
  ]);

  this.setObjectContentTypeHeader(input, headers);

  return this._fetchObject<CreateMultipartUploadOutput>(
    input,
    'POST',
    { uploads: '' },
    headers,
    ''
  );
}
