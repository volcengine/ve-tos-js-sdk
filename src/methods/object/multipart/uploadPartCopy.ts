import {
  fillRequestHeaders,
  requestHeadersMap,
  safeAwait,
  normalizeHeadersKey,
} from '../../../utils';
import TOSBase from '../../base';

export interface UploadPartCopyInput {
  bucket?: string;
  key: string;
  partNumber: number;
  uploadId: string;
  copySourceSSECAlgorithm?: string;
  copySourceSSECKey?: string;
  copySourceSSECKeyMD5?: string;
  ssecAlgorithm?: string;
  ssecKey?: string;
  ssecKeyMD5?: string;
  headers?: {
    [key: string]: string | undefined;
    'x-tos-copy-source'?: string;
    'x-tos-copy-source-range'?: string;
    'x-tos-copy-source-if-match'?: string;
    'x-tos-copy-source-if-modified-since'?: string;
    'x-tos-copy-source-if-none-match'?: string;
    'x-tos-copy-source-if-unmodified-since'?: string;
    'x-tos-copy-source-server-side-encryption-customer-algorithm'?: string;
    'x-tos-copy-source-server-side-encryption-customer-key'?: string;
    'x-tos-copy-source-server-side-encryption-customer-key-MD5'?: string;
  };
}

export interface UploadPartCopyOutput {
  ETag: string;
  LastModified: string;
  SSECAlgorithm: string;
  SSECKeyMD5: string;
}

export async function uploadPartCopy(
  this: TOSBase,
  input: UploadPartCopyInput
) {
  const { uploadId, partNumber } = input;
  const headers = normalizeHeadersKey(input.headers);
  input.headers = headers;
  fillRequestHeaders(input, [
    'copySourceSSECAlgorithm',
    'copySourceSSECKey',
    'copySourceSSECKeyMD5',
    'ssecAlgorithm',
    'ssecKey',
    'ssecKeyMD5',
  ]);

  const [err, res] = await safeAwait(
    this.fetchObject<UploadPartCopyOutput>(
      input,
      'PUT',
      { partNumber, uploadId },
      headers,
      undefined,
      {
        handleResponse(response) {
          return {
            ...response.data,
            SSECAlgorithm:
              response.headers[requestHeadersMap['ssecAlgorithm'] as string],
            SSECKeyMD5:
              response.headers[requestHeadersMap['ssecKeyMD5'] as string],
          };
        },
      }
    )
  );

  if (err || !res || !res.data.ETag) {
    // TODO: throw TosServerErr
    throw err;
  }

  return res;
}
