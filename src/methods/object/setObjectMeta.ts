import { fillRequestHeaders, normalizeHeadersKey } from '../../utils';
import TOSBase from '../base';

export interface SetObjectMetaInput {
  bucket?: string;
  key: string;
  versionId?: string;

  // object meta data
  cacheControl?: string;
  contentDisposition?: string;
  contentEncoding?: string;
  contentLanguage?: string;
  contentType?: string;
  expires?: Date;
  meta?: Record<string, string>;

  headers?: {
    [key: string]: string | undefined;
    'Cache-Control'?: string;
    'Content-Disposition'?: string;
    Expires?: string;
    'Content-Type'?: string;
    'Content-Language'?: string;
  };
}

export async function setObjectMeta(
  this: TOSBase,
  input: SetObjectMetaInput | string
) {
  const normalizedInput = typeof input === 'string' ? { key: input } : input;
  const headers = (normalizedInput.headers = normalizeHeadersKey(
    normalizedInput.headers
  ));
  fillRequestHeaders(normalizedInput, [
    'cacheControl',
    'contentDisposition',
    'contentEncoding',
    'contentLanguage',
    'contentType',
    'expires',
    'meta',
  ]);
  const query: Record<string, any> = { metadata: '' };
  if (normalizedInput.versionId) {
    query.versionId = normalizedInput.versionId;
  }

  return this._fetchObject<undefined>(input, 'POST', query, headers);
}

export default setObjectMeta;
