import { StorageClass } from '../../interface';
import { fillRequestHeaders, normalizeHeadersKey } from '../../utils';
import TOSBase from '../base';
import { ReplicationStatusType } from '../../TosExportEnum';
import { RestoreInfo, TosHeader } from './sharedTypes';
import { getRestoreInfoFromHeaders } from './utils';

export interface HeadObjectInput {
  bucket?: string;
  key: string;
  versionId?: string;

  ifMatch?: string;
  ifModifiedSince?: string;
  ifNoneMatch?: string;
  ifUnmodifiedSince?: string;

  ssecAlgorithm?: string;
  ssecKey?: string;
  ssecKeyMD5?: string;

  headers?: {
    [key: string]: string | undefined;
    'If-Match'?: string;
    'If-Modified-Since'?: string;
    'If-None-Match'?: string;
    'If-Unmodified-Since'?: string;
    'x-tos-server-side-encryption-customer-algorithm'?: string;
    'x-tos-server-side-encryption-customer-key'?: string;
    'x-tos-server-side-encryption-customer-key-md5'?: string;
  };
}

export interface HeadObjectOutput {
  [key: string]: string | undefined | object;
  'content-length': string;
  'last-modified': string;
  'content-md5': string;
  etag: string;
  'x-tos-object-type'?: 'Appendable';
  'x-tos-delete-marker'?: string;
  'x-tos-server-side-encryption-customer-algorithm'?: string;
  'x-tos-server-side-encryption-customer-key-md5'?: string;
  'x-tos-version-id'?: string;
  'x-tos-website-redirect-location'?: string;
  'x-tos-hash-crc64ecma'?: string;
  'x-tos-storage-class': StorageClass;
  'x-tos-server-side-encryption'?: string;
  'x-tos-replication-status'?: ReplicationStatusType;
  RestoreInfo?: RestoreInfo;
  ReplicationStatus?: ReplicationStatusType;
}

export async function headObject(
  this: TOSBase,
  input: HeadObjectInput | string
) {
  const normalizedInput = typeof input === 'string' ? { key: input } : input;
  const headers = normalizeHeadersKey(normalizedInput.headers);
  normalizedInput.headers = headers;

  const query: Record<string, any> = {};
  if (normalizedInput.versionId) {
    query.versionId = normalizedInput.versionId;
  }

  fillRequestHeaders(normalizedInput, [
    'ifMatch',
    'ifModifiedSince',
    'ifNoneMatch',
    'ifUnmodifiedSince',
    'ssecAlgorithm',
    'ssecKey',
    'ssecKeyMD5',
  ]);

  return this._fetchObject<HeadObjectOutput>(
    input,
    'HEAD',
    query,
    normalizedInput?.headers || {},
    undefined,
    {
      handleResponse: (res) => {
        const result = {
          ...res.headers,
          ReplicationStatus: res.headers[TosHeader.HeaderReplicationStatus],
        };
        const info = getRestoreInfoFromHeaders(res.headers);

        if (info) {
          result.RestoreInfo = info;
        }
        return result;
      },
    }
  );
}

export default headObject;
