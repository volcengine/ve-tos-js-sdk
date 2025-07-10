import { convertNormalCamelCase2Upper } from '../../utils';
import TOSBase from '../base';

const CommonQueryKey = 'requestPayment';

export interface PutBucketRequestPayment {
  bucket?: string;
  Payer: 'BucketOwner' | 'Requester';
}

export interface PutBucketRequestPaymentOutput {}

/**
 * @private unstable
 */
export async function putBucketRequestPayment(
  this: TOSBase,
  input: PutBucketRequestPayment
) {
  const { bucket, ...otherProps } = input;

  const body = convertNormalCamelCase2Upper(otherProps);
  return this.fetchBucket<PutBucketRequestPayment>(
    bucket,
    'PUT',
    { [CommonQueryKey]: '' },
    {},
    {
      ...body,
    }
  );
}

export interface GetBucketRequestPaymentInput {
  bucket?: string;
}

export interface GetBucketRequestPaymentOutput {
  Payer: 'BucketOwner' | 'Requester';
}

/**
 * @private unstable
 */
export async function getBucketRequestPayment(
  this: TOSBase,
  input: GetBucketRequestPaymentInput
) {
  const { bucket } = input;
  return await this.fetchBucket<GetBucketRequestPaymentOutput>(
    bucket,
    'GET',
    { [CommonQueryKey]: '' },
    {}
  );
}
