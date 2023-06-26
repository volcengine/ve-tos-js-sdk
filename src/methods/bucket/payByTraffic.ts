import TOSBase, { TosResponse } from '../base';

export interface BucketPayByTraffic {
  ChargeType: 'FlowOut' | 'Bandwidth';
  ActiveType: 'NextDay' | 'NextMonth';
}

export interface PutBucketPayByTrafficInput {
  bucket?: string;
  payByTraffic: BucketPayByTraffic;
}

export type GetBucketPayByTrafficOutput = BucketPayByTraffic & {
  ActiveTime: string;
};

/**
 * @private unstable method
 */
export async function putBucketPayByTraffic(
  this: TOSBase,
  input: PutBucketPayByTrafficInput
) {
  const res = await this.fetchBucket(
    input.bucket,
    'PUT',
    { payByTraffic: '' },
    {},
    input.payByTraffic
  );
  return res;
}

interface GetBucketPayByTrafficInput {
  bucket: string;
}
/**
 * @private unstable method
 */
export async function getBucketPayByTraffic(
  this: TOSBase,
  { bucket }: GetBucketPayByTrafficInput
): Promise<TosResponse<GetBucketPayByTrafficOutput>> {
  const res = await this.fetchBucket<GetBucketPayByTrafficOutput>(
    bucket,
    'GET',
    {
      payByTraffic: '',
    },
    {}
  );
  return res;
}
