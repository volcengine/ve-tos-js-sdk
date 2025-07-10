import { handleEmptyServerError } from '../../handleEmptyServerError';
import TOSBase, { TosResponse } from '../base';

export interface BucketLoggingData {
  targetBucket: string;
  targetPrefix?: string;
  role?: string;
}

export interface PutBucketLoggingInput {
  bucket: string;
  data: BucketLoggingData;
}

export interface PutBucketLoggingOutput {}

export interface GetBucketLoggingInput {
  bucket: string;
}
export type GetBucketLoggingOutput =
  | {
      LoggingEnabled: {
        TargetBucket: string;
        TargetPrefix?: string;
        Role?: string;
      } | null;
    }
  | undefined;

/**
 * @private unstable method
 * 获取日志存储
 */
export async function getBucketLogging(
  this: TOSBase,
  req: GetBucketLoggingInput
): Promise<TosResponse<GetBucketLoggingOutput>> {
  try {
    const res = await this.fetchBucket<GetBucketLoggingOutput>(
      req.bucket,
      'GET',
      {
        logging: '',
      },
      {}
    );

    return res;
  } catch (error) {
    return handleEmptyServerError<GetBucketLoggingOutput>(error, {
      enableCatchEmptyServerError: this.opts.enableOptimizeMethodBehavior,
      methodKey: 'getBucketLogging',
      defaultResponse: undefined,
    });
  }
}

/**
 * @private unstable method
 */
export function putBucketLogging(
  this: TOSBase,
  req: PutBucketLoggingInput
): Promise<TosResponse<PutBucketLoggingOutput>> {
  return this.fetchBucket(
    req.bucket,
    'PUT',
    { logging: '' },
    {},
    {
      LoggingEnabled: {
        TargetBucket: req.data.targetBucket,
        TargetPrefix: req.data.targetPrefix,
        Role: req.data.role,
      },
    }
  );
}

/**
 * @private unstable method
 */
export function deleteBucketLogging(
  this: TOSBase,
  req: GetBucketLoggingInput
): Promise<TosResponse<PutBucketLoggingOutput>> {
  return this.fetchBucket(req.bucket, 'PUT', { logging: '' }, {}, {});
}
