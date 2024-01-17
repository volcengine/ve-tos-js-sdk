import { convertNormalCamelCase2Upper } from '../../utils';
import TOSBase from '../base';

const CommonQueryKey = 'rename';

export interface PutBucketRenameInput {
  bucket?: string;
  renameEnable: boolean;
}

export interface PutBucketRenameOutput {}

export async function putBucketRename(
  this: TOSBase,
  input: PutBucketRenameInput
) {
  const { bucket, ...otherProps } = input;

  const body = convertNormalCamelCase2Upper(otherProps);
  return this.fetchBucket<PutBucketRenameOutput>(
    bucket,
    'PUT',
    { [CommonQueryKey]: '' },
    {},
    {
      ...body,
    }
  );
}

export interface GetBucketRenameInput {
  bucket?: string;
}

export interface GetBucketRenameOutput {
  RenameEnable: boolean;
}

export async function getBucketRename(
  this: TOSBase,
  input: GetBucketRenameInput
) {
  const { bucket } = input;
  return await this.fetchBucket<GetBucketRenameOutput>(
    bucket,
    'GET',
    { [CommonQueryKey]: '' },
    {}
  );
}

export interface DeleteBucketRenameInput {
  bucket?: string;
}

export interface DeleteBucketRenameOutput {}

export async function deleteBucketRename(
  this: TOSBase,
  input: DeleteBucketRenameInput
) {
  const { bucket } = input;

  return this.fetchBucket<DeleteBucketRenameOutput>(
    bucket,
    'DELETE',
    { [CommonQueryKey]: '' },
    {}
  );
}
