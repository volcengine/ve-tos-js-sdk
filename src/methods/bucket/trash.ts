import { convertNormalCamelCase2Upper } from '../../utils';
import TOSBase from '../base';

const CommonQueryKey = 'trash';

interface BucketTrash {
  TrashPath: string;
  CleanInterval: number;
  Status: 'Enabled' | 'Disabled';
  PrefixMatchRules?: Array<{
    PrefixList: string[];
    TrashPath: string;
    CleanInterval: number;
  }>
}

export interface PutBucketTrashInput {
  bucket?: string;
  Trash: BucketTrash;
}

export interface PutBucketTrashOutput {}

export async function putBucketTrash(
  this: TOSBase,
  input: PutBucketTrashInput
) {
  const { bucket, ...otherProps } = input;

  const body = convertNormalCamelCase2Upper(otherProps);
  return this.fetchBucket<PutBucketTrashOutput>(
    bucket,
    'PUT',
    { [CommonQueryKey]: '' },
    {},
    {
      ...body,
    }
  );
}

export interface GetBucketTrashInput {
  bucket?: string;
}

export interface GetBucketTrashOutput {
  Trash: BucketTrash;
}

export async function getBucketTrash(
  this: TOSBase,
  input: GetBucketTrashInput
) {
  const { bucket } = input;
  return await this.fetchBucket<GetBucketTrashOutput>(
    bucket,
    'GET',
    { [CommonQueryKey]: '' },
    {}
  );
}
