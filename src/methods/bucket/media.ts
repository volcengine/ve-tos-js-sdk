import TOSBase from '../base';
import { handleEmptyServerError } from '../../handleEmptyServerError';

export interface PutBucketPrivateM3U8Input {
  bucket: string;
  enable: boolean;
}

export interface PutPrivateM3U8Output {}

/**
 * @private unstable
 */
export async function putBucketPrivateM3U8(
  this: TOSBase,
  input: PutBucketPrivateM3U8Input
) {
  const { bucket, enable } = input;
  return await this.fetchBucket(
    bucket,
    'PUT',
    {
      privateM3U8: '',
    },
    {},
    {
      Enable: enable,
    }
  );
}

export interface GetBucketPrivateM3U8Input {
  bucket: string;
}

export interface GetBucketPrivateM3U8Output {
  Enable: boolean;
}

/**
 * @private unstable
 */
export async function getBucketPrivateM3U8(
  this: TOSBase,
  input: GetBucketPrivateM3U8Input
) {
  const { bucket } = input;
  try {
    return await this.fetchBucket<GetBucketPrivateM3U8Output>(
      bucket,
      'GET',
      {
        privateM3U8: '',
      },
      {}
    );
  } catch (error) {
    return handleEmptyServerError(error, {
      enableCatchEmptyServerError: this.opts.enableOptimizeMethodBehavior,
      methodKey: 'getBucketPrivateM3U8',
      defaultResponse: {
        Enable: false,
      },
    });
  }
}

interface PutBucketBlindWatermarkInput {
  bucket: string;
  enable: boolean;
}

/**
 * @private unstable
 */
export async function putBucketBlindWatermark(
  this: TOSBase,
  input: PutBucketBlindWatermarkInput
) {
  const { bucket, enable } = input;
  return await this.fetchBucket(
    bucket,
    'PUT',
    {
      blindWatermark: '',
    },
    {},
    {
      Enable: enable,
    }
  );
}

export interface GetBucketBlindWatermarkInput {
  bucket: string;
}

export interface GetBucketBlindWatermarkOutput {
  Enable: boolean;
}

/**
 * @private unstable
 */
export async function getBucketBlindWatermark(
  this: TOSBase,
  input: GetBucketBlindWatermarkInput
) {
  const { bucket } = input;
  try {
    return await this.fetchBucket<GetBucketBlindWatermarkOutput>(
      bucket,
      'GET',
      {
        blindWatermark: '',
      },
      {}
    );
  } catch (error) {
    return handleEmptyServerError(error, {
      enableCatchEmptyServerError: this.opts.enableOptimizeMethodBehavior,
      methodKey: 'getBucketBlindWatermark',
      defaultResponse: {
        Enable: false,
      },
    });
  }
}
