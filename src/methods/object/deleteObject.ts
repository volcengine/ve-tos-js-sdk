import TOSBase from '../base';

export interface DeleteObjectInput {
  bucket?: string;
  key: string;
  versionId?: string;
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
  const res = await this.fetchObject<DeleteObjectOutput>(
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
