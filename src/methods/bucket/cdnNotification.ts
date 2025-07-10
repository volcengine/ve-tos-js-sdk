import TOSBase from '../base';
import { handleEmptyServerError } from '../../handleEmptyServerError';

interface FilterRule {
  Name?: string;
  Value?: string;
}

export interface CdnNotificationRule {
  RuleId?: string;
  CustomDomain: string;
  Events: string[];
  Filter?: {
    TOSKey?: {
      FilterRules: FilterRule[];
    };
  };
}

export interface PutBucketCdnNotificationInput {
  role: string;
  bucket: string;
  rules: CdnNotificationRule[];
}

export interface PutBucketCdnNotificationOutput {}

/**
 * @private unstable method
 */
export async function putBucketCdnNotification(
  this: TOSBase,
  input: PutBucketCdnNotificationInput
) {
  const { bucket, role, rules } = input;

  if (this.opts.enableOptimizeMethodBehavior && !rules.length) {
    return deleteBucketCdnNotification.call(this, {
      bucket,
    });
  }

  return this.fetchBucket<PutBucketCdnNotificationOutput>(
    bucket,
    'PUT',
    {
      cdn_notification: '',
    },
    {},
    {
      Role: role,
      Rules: rules,
    }
  );
}

export interface GetBucketCdnNotificationInput {
  bucket: string;
}

export interface GetBucketCdnNotificationOutput {
  Role: string;
  Rules: CdnNotificationRule[];
}

/**
 * @private unstable method
 */
export async function getBucketCdnNotification(
  this: TOSBase,
  input: GetBucketCdnNotificationInput
) {
  const { bucket } = input;
  try {
    return await this.fetchBucket<GetBucketCdnNotificationOutput>(
      bucket,
      'GET',
      {
        cdn_notification: '',
      },
      {}
    );
  } catch (error) {
    return handleEmptyServerError<GetBucketCdnNotificationOutput>(error, {
      enableCatchEmptyServerError: this.opts.enableOptimizeMethodBehavior,
      methodKey: 'getBucketCdnNotification',
      defaultResponse: {
        Rules: [],
        Role: '',
      },
    });
  }
}

export interface DeleteBucketCdnNotificationInput {
  bucket: string;
}

export interface DeleteBucketCdnNotificationOutput {}

/**
 * @private unstable method
 */
export async function deleteBucketCdnNotification(
  this: TOSBase,
  input: DeleteBucketCdnNotificationInput
) {
  const { bucket } = input;
  return await this.fetchBucket<DeleteBucketCdnNotificationOutput>(
    bucket,
    'DELETE',
    {
      cdn_notification: '',
    },
    {}
  );
}
