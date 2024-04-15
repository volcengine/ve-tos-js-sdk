import { handleEmptyServerError } from '../../handleEmptyServerError';
import TOSBase, { TosResponse } from '../base';

interface TagSet {
  Tags: {
    Key: string;
    Value: string;
  }[];
}

export interface PutBucketTaggingInput {
  bucket?: string;
  tagging: {
    TagSet: TagSet;
  };
}

export interface GetBucketTaggingInput {
  bucket: string;
}
export interface GetBucketTaggingOutput {
  TagSet: TagSet;
}

/**
 * @private unstable method
 */
export async function putBucketTagging(
  this: TOSBase,
  input: PutBucketTaggingInput
) {
  const res = await this.fetchBucket(
    input.bucket,
    'PUT',
    { tagging: '' },
    {},
    input.tagging,
    {
      needMd5: true,
    }
  );
  return res;
}

/**
 * @private unstable method
 */
export async function getBucketTagging(
  this: TOSBase,
  { bucket }: GetBucketTaggingInput
): Promise<TosResponse<GetBucketTaggingOutput>> {
  try {
    const res = await this.fetchBucket<GetBucketTaggingOutput>(
      bucket,
      'GET',
      {
        tagging: '',
      },
      {}
    );
    return res;
  } catch (error) {
    return handleEmptyServerError<GetBucketTaggingOutput>(error, {
      enableCatchEmptyServerError: this.opts.enableOptimizeMethodBehavior,
      methodKey: 'getBucketTagging',
      defaultResponse: {
        TagSet: {
          Tags: [],
        },
      },
    });
  }
}

export interface DeleteBucketTaggingInput {
  bucket: string;
}

/**
 * @private unstable method
 */
export async function deleteBucketTagging(
  this: TOSBase,
  { bucket }: DeleteBucketTaggingInput
) {
  return this.fetchBucket(bucket, 'DELETE', { tagging: '' }, {});
}
