import TOSBase, { TosResponse } from '../base';
import { fillRequestHeaders, normalizeHeadersKey } from '../../utils';
import { Acl } from '../../interface';
import { StorageClassType } from '../../TosExportEnum';

export interface PutSymInput {
  bucket?: string;
  key: string;
  symLinkTargetKey: string;
  symLinkTargetBucket?: string;
  forbidOverwrite?: boolean;
  acl?: Acl;
  meta?: Record<string, string>;
  storageClass?: StorageClassType;

  headers?: {
    'x-tos-symlink-target': string;
    'x-tos-symlink-bucket'?: string;
    'x-tos-forbid-overwrite'?: string;
    'x-tos-acl'?: Acl;
    'x-tos-storage-class'?: string;
    [key: string]: string | undefined;
  };
}

export interface PutSymOutput {
  VersionID?: string;
}
/**
 * @private unstable method
 */
export async function putSymlink(this: TOSBase, input: PutSymInput) {
  return _putSymlink.call(this, input);
}

export async function _putSymlink(
  this: TOSBase,
  input: PutSymInput
): Promise<TosResponse<PutSymOutput>> {
  const headers = (input.headers = normalizeHeadersKey(input.headers));
  fillRequestHeaders(input, [
    'symLinkTargetKey',
    'symLinkTargetBucket',
    'forbidOverwrite',
    'acl',
    'storageClass',
    'meta',
  ]);
  return this._fetchObject<PutSymOutput>(
    input,
    'PUT',
    { symlink: '' },
    headers,
    undefined,
    {
      handleResponse(response) {
        const { headers } = response;
        return {
          VersionID: headers['x-tos-version-id'],
        };
      },
    }
  );
}

export default putSymlink;
