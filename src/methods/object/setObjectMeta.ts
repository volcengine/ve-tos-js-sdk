import TOSBase from '../base';

export interface SetObjectMetaInput {
  bucket?: string;
  key: string;
  versionId?: string;
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
  const query: Record<string, any> = { metadata: '' };
  if (normalizedInput.versionId) {
    query.versionId = normalizedInput.versionId;
  }

  return this.fetchObject<undefined>(
    input,
    'POST',
    query,
    normalizedInput.headers || {}
  );
}

export default setObjectMeta;
