import { StorageClassType } from '../../TosExportEnum';
import TOSBase from '../base';

interface LifecycleRule {
  ID?: string;
  Prefix?: string;
  Status: 'Enabled' | 'Disabled';
  Expiration?: { Days: number };
  Days?: number;
  Date?: string;
  NoncurrentVersionExpiration?: { NoncurrentDays?: number };
  AbortIncompleteMultipartUpload?: { DaysAfterInitiation?: number };
  DaysAfterInitiation?: number;
  Transitions?: {
    StorageClass?: StorageClassType;
    Days?: number;
  }[];
  NoncurrentVersionTransitions?: {
    StorageClass?: StorageClassType;
    NoncurrentDays?: number;
  }[];
  Tags?: {
    Key?: string;
    Value?: string;
  }[];
}

export interface PutBucketLifecycleInput {
  bucket: string;
  rules: LifecycleRule[];
}

export interface PutBucketLifecycleOutput {}

export async function putBucketLifecycle(
  this: TOSBase,
  input: PutBucketLifecycleInput
) {
  const { bucket, rules } = input;

  return this.fetchBucket<PutBucketLifecycleOutput>(
    bucket,
    'PUT',
    { lifecycle: '' },
    {},
    {
      Rules: rules,
    }
  );
}

export interface GetBucketLifecycleInput {
  bucket: string;
}

export interface GetBucketLifecycleOutput {
  Rules: LifecycleRule[];
}

export async function getBucketLifecycle(
  this: TOSBase,
  input: GetBucketLifecycleInput
) {
  const { bucket } = input;

  return this.fetchBucket<GetBucketLifecycleOutput>(
    bucket,
    'GET',
    { lifecycle: '' },
    {}
  );
}

export interface DeleteBucketLifecycleInput {
  bucket: string;
}

export interface DeleteBucketLifecycleOutput {}

export async function deleteBucketLifecycle(
  this: TOSBase,
  input: DeleteBucketLifecycleInput
) {
  const { bucket } = input;

  return this.fetchBucket<DeleteBucketLifecycleOutput>(
    bucket,
    'DELETE',
    { lifecycle: '' },
    {}
  );
}
