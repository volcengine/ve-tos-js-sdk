import { makeArrayProp } from '../../utils';
import TOSBase from '../base';

export interface DeleteMultiObjectsInput {
  bucket?: string;
  /**
   * default: false
   */
  quiet?: boolean;
  objects: {
    key: string;
    versionId?: string;
  }[];
  /**@private unstable */
  skipTrash?: string;
  /**@private unstable */
  recursive?: string;
}

export interface DeleteMultiObjectsOutput {
  Deleted: {
    Key: string;
    VersionId: string;
    DeleteMarker?: boolean;
    DeleteMarkerVersionId?: string;
  }[];

  Error: {
    Code: string;
    Message: string;
    Key: string;
    VersionId: string;
  }[];
}

export async function deleteMultiObjects(
  this: TOSBase,
  input: DeleteMultiObjectsInput
) {
  const body = {
    Quiet: input.quiet,
    Objects: input.objects.map((it) => ({
      Key: it.key,
      VersionId: it.versionId,
    })),
  };

  const query: Record<string, string> = {
    delete: '',
  };

  if (input.skipTrash) {
    query.skipTrash = input.skipTrash;
  }

  if (input.recursive) {
    query.recursive = input.recursive;
  }

  const res = await this.fetchBucket<DeleteMultiObjectsOutput>(
    input.bucket,
    'POST',
    query,
    {},
    body
  );

  const arrayProp = makeArrayProp(res.data);
  arrayProp('Deleted');
  arrayProp('Error');

  return res;
}

export default deleteMultiObjects;
