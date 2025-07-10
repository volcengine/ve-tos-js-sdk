import TOSBase from '../base';
import { handleEmptyServerError } from '../../handleEmptyServerError';

interface DefaultRetention {
  Days?: number;
  Years?: number;
  Mode: 'COMPLIANCE';
}

interface BucketObjectLockRule {
  DefaultRetention: DefaultRetention;
}

export interface PutBucketObjectLockConfigurationInput {
  bucket: string;
  objectLockEnabled: 'Enabled';
  rule?: BucketObjectLockRule;
}

export interface PutBucketObjectLockConfigurationOutput {}

/**
 * @private unstable method
 */

export async function putBucketObjectLockConfiguration(
  this: TOSBase,
  input: PutBucketObjectLockConfigurationInput
) {
  const { bucket, objectLockEnabled, rule } = input;
  return this.fetchBucket<PutBucketObjectLockConfigurationOutput>(
    bucket,
    'PUT',
    { 'object-lock': '' },
    {},
    {
      ObjectLockEnabled: objectLockEnabled,
      Rule: rule,
    }
  );
}

export interface GetBucketObjectLockConfigurationInput {
  bucket: string;
}

export interface GetBucketObjectLockConfigurationOutput {
  ObjectLockEnabled?: 'Enabled';
  Rule?: BucketObjectLockRule;
}

/**
 * @private unstable method
 */
export async function getBucketObjectLockConfiguration(
  this: TOSBase,
  input: GetBucketObjectLockConfigurationInput
) {
  const { bucket } = input;
  try {
    const res = await this.fetchBucket<GetBucketObjectLockConfigurationOutput>(
      bucket,
      'GET',
      { 'object-lock': '' },
      {}
    );
    return res;
  } catch (error) {
    return handleEmptyServerError<GetBucketObjectLockConfigurationOutput>(
      error,
      {
        enableCatchEmptyServerError: this.opts.enableOptimizeMethodBehavior,
        methodKey: 'getBucketObjectLockConfiguration',
        defaultResponse: {},
      }
    );
  }
}
