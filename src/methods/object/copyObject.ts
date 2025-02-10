import {
  safeAwait,
  normalizeHeadersKey,
  fillRequestHeaders,
} from '../../utils';
import { StorageClass, ServerSideEncryption, Acl } from '../../interface';
import TOSBase, { TosResponse } from '../base';
import { StorageClassType } from '../../TosExportEnum';
import { getCopySourceHeaderValue } from './utils';

export interface CopyObjectInput {
  bucket?: string;
  key: string;

  srcBucket?: string;
  srcKey?: string;
  srcVersionID?: string;
  cacheControl?: string;
  contentDisposition?: string;
  contentEncoding?: string;
  contentLanguage?: string;
  contentType?: string;
  expires?: Date;

  copySourceIfMatch?: string;
  copySourceIfModifiedSince?: string | Date;
  copySourceIfNoneMatch?: string;
  copySourceIfUnmodifiedSince?: string;
  copySourceSSECAlgorithm?: string;
  copySourceSSECKey?: string;
  copySourceSSECKeyMD5?: string;

  ssecAlgorithm?: string;
  ssecKey?: string;
  ssecKeyMD5?: string;
  serverSideEncryption?: string;
  /**
   * unit: bit/s
   * server side traffic limit
   **/
  trafficLimit?: number;

  acl?: Acl;
  grantFullControl?: string;
  grantRead?: string;
  grantReadAcp?: string;
  grantWriteAcp?: string;

  metadataDirective?: string;
  meta?: Record<string, string>;
  websiteRedirectLocation?: string;
  storageClass?: StorageClassType;
  ifMatch?: string;
  forbidOverwrite?: boolean;

  headers?: {
    [key: string]: string | undefined;
    ['x-tos-copy-source']?: string;
    ['x-tos-acl']?: string;
    ['x-tos-copy-source-if-match']?: string;
    ['x-tos-copy-source-if-modified-since']?: string;
    ['x-tos-copy-source-if-none-match']?: string;
    ['x-tos-copy-source-if-unmodified-since']?: string;
    ['x-tos-copy-source-server-side-encryption-customer-algorithm']?: string;
    ['x-tos-copy-source-server-side-encryption-customer-key']?: string;
    ['x-tos-copy-source-server-side-encryption-customer-key-MD5']?: string;
    ['x-tos-grant-full-control']?: string;
    ['x-tos-grant-read']?: string;
    ['x-tos-grant-read-acp']?: string;
    ['x-tos-metadata-directive']?: string;
    ['x-tos-website-redirect-location']?: string;
    ['x-tos-storage-class']?: StorageClass;
    ['x-tos-server-side-encryption']?: ServerSideEncryption;
    ['x-tos-forbid-overwrite']?: string;
    'If-Match'?: string;
  };
}

interface CopyObjectBody {
  ETag: string;
}

export interface CopyObjectOutput extends CopyObjectBody {}

export async function copyObject(
  this: TOSBase,
  input: CopyObjectInput
): Promise<TosResponse<CopyObjectOutput>> {
  const headers = normalizeHeadersKey(input.headers);
  input.headers = headers;
  fillRequestHeaders(input, [
    'cacheControl',
    'contentDisposition',
    'contentEncoding',
    'contentLanguage',
    'contentType',
    'expires',

    'copySourceIfMatch',
    'copySourceIfModifiedSince',
    'copySourceIfNoneMatch',
    'copySourceIfUnmodifiedSince',
    'copySourceSSECAlgorithm',
    'copySourceSSECKey',
    'copySourceSSECKeyMD5',

    'acl',
    'grantFullControl',
    'grantRead',
    'grantReadAcp',
    'grantWriteAcp',

    'ssecAlgorithm',
    'ssecKey',
    'ssecKeyMD5',
    'serverSideEncryption',

    'metadataDirective',
    'meta',
    'websiteRedirectLocation',
    'storageClass',
    'trafficLimit',
    'forbidOverwrite',
    'ifMatch',
  ]);
  if (input.srcBucket && input.srcKey) {
    let copySource = getCopySourceHeaderValue(input.srcBucket, input.srcKey);
    if (input.srcVersionID) {
      copySource += `?versionId=${input.srcVersionID}`;
    }
    headers['x-tos-copy-source'] = headers['x-tos-copy-source'] ?? copySource;
  }

  const [err, res] = await safeAwait(
    this._fetchObject<CopyObjectBody>(input, 'PUT', {}, headers)
  );

  if (err || !res || !res.data.ETag) {
    // TODO: throw TosServerErr
    throw err;
  }
  return res;
}

export default copyObject;
