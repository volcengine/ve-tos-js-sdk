import { StorageClassType } from '../../TosExportEnum';
import TOSBase from '../base';
import { fillRequestHeaders, normalizeHeadersKey } from '../../utils';
import { handleEmptyServerError } from '../../handleEmptyServerError';

interface LifecycleRule {
  ID?: string;
  Prefix?: string;
  Status: 'Enabled' | 'Disabled';
  Filter?: {
    GreaterThanIncludeEqual?: 'Enabled' | 'Disabled';
    LessThanIncludeEqual?: 'Enabled' | 'Disabled';
    /** unit bit */
    ObjectSizeGreaterThan?: number;
    /** unit bit */
    ObjectSizeLessThan?: number;
  };
  Expiration?: { Date?: string; Days?: number };
  Days?: number;
  Date?: string;
  NoncurrentVersionExpiration?: {
    NoncurrentDays?: number;
    NoncurrentDate?: string;
  };
  AbortIncompleteMultipartUpload?: { DaysAfterInitiation?: number };
  DaysAfterInitiation?: number;
  Transitions?: {
    StorageClass: StorageClassType;
    Days?: number;
    Date?: string;
  }[];
  /**
   * @private unstable
   */
  AccessTimeTransitions?: {
    StorageClass: StorageClassType;
    Days?: number;
  }[];
  /**
   * @private unstable
   */
  NoncurrentVersionAccessTimeTransitions?: {
    StorageClass: StorageClassType;
    NoncurrentDays?: number;
  }[];
  NoncurrentVersionTransitions?: {
    StorageClass?: StorageClassType;
    NoncurrentDays?: number;
    NoncurrentDate?: string;
  }[];
  Tags?: {
    Key?: string;
    Value?: string;
  }[];
}

export interface PutBucketLifecycleInput {
  bucket: string;
  rules: LifecycleRule[];
  allowSameActionOverlap?: boolean;
}

export interface PutBucketLifecycleOutput {}

export async function putBucketLifecycle(
  this: TOSBase,
  input: PutBucketLifecycleInput
) {
  const { bucket, rules } = input;
  if (this.opts.enableOptimizeMethodBehavior && !rules.length) {
    return deleteBucketLifecycle.call(this, { bucket });
  }

  const headers = {};
  fillRequestHeaders({ ...input, headers }, ['allowSameActionOverlap']);

  return this.fetchBucket<PutBucketLifecycleOutput>(
    bucket,
    'PUT',
    { lifecycle: '' },
    headers,
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
  AllowSameActionOverlap?: boolean;
}

export async function getBucketLifecycle(
  this: TOSBase,
  input: GetBucketLifecycleInput
) {
  try {
    const { bucket } = input;

    return await this.fetchBucket<GetBucketLifecycleOutput>(
      bucket,
      'GET',
      { lifecycle: '' },
      {},
      {},
      {
        handleResponse: (res) => {
          return {
            AllowSameActionOverlap:
              res.headers['x-tos-allow-same-action-overlap'],
            Rules: res.data.Rules,
          };
        },
      }
    );
  } catch (error) {
    return handleEmptyServerError<GetBucketLifecycleOutput>(error, {
      enableCatchEmptyServerError: this.opts.enableOptimizeMethodBehavior,
      methodKey: 'getBucketLifecycle',
      defaultResponse: {
        Rules: [],
      },
    });
  }
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
