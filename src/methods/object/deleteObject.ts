import TOSBase from '../base';

export interface DeleteObjectInput {
  bucket?: string;
  key: string;
  versionId?: string;
  /**@private unstable */
  skipTrash?: string;
  /**@private unstable */
  recursive?: string;
}

export interface DeleteObjectOutput {
  [key: string]: string | undefined;
  ['x-tos-delete-marker']: string;
  ['x-tos-version-id']: string;
}

export async function deleteObject(
  this: TOSBase,
  input: DeleteObjectInput | string
) {
  const normalizedInput = typeof input === 'string' ? { key: input } : input;
  const query: Record<string, any> = {};
  if (normalizedInput.versionId) {
    query.versionId = normalizedInput.versionId;
  }
  if (normalizedInput.skipTrash) {
    query.skipTrash = normalizedInput.skipTrash;
  }
  if (normalizedInput.recursive) {
    query.recursive = normalizedInput.recursive;
  }
  const res = await this._fetchObject<DeleteObjectOutput>(
    input,
    'DELETE',
    query,
    {},
    {},
    { handleResponse: (res) => res.headers }
  );
  return res;
}

export default deleteObject;
