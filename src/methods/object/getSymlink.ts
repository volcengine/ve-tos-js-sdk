import TOSBase, { TosResponse } from '../base';

export interface GetSymInput {
  bucket?: string;
  key: string;
  versionId?: string;
}

export interface PutSymOutput {
  VersionID?: string;
  SymlinkTargetKey: string;
  SymlinkTargetBucket: string;
  LastModified: string;
}

/**
 * @private unstable method
 */
export async function getSymlink(this: TOSBase, input: GetSymInput) {
  return _getSymlink.call(this, input);
}

export async function _getSymlink(
  this: TOSBase,
  input: GetSymInput
): Promise<TosResponse<PutSymOutput>> {
  const query: Record<string, any> = { symlink: '' };
  if (input.versionId) {
    query.versionId = input.versionId;
  }
  return this._fetchObject<PutSymOutput>(input, 'GET', query, {}, undefined, {
    handleResponse: (res) => {
      const { headers } = res;
      return {
        VersionID: headers['x-tos-version-id'],
        SymlinkTargetKey: headers['x-tos-symlink-target'],
        SymlinkTargetBucket: headers['x-tos-symlink-bucket'],
        LastModified: headers['last-modified'],
      };
    },
  });
}

export default getSymlink;
