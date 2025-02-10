import { handleEmptyServerError } from '../../handleEmptyServerError';
import { TransferAccelerationStatusType } from '../../TosExportEnum';
import { convertNormalCamelCase2Upper } from '../../utils';
import { Headers } from '../../interface';
import TOSBase from '../base';

const CommonQueryKey = 'transferAcceleration';

export interface PutBucketTransferAccelerationInput {
  bucket?: string;
  transferAccelerationConfiguration: {
    Enabled: 'true' | 'false';
  };
}

export interface PutBucketTransferAccelerationOutput {}

/**
 * @private unstable
 */
export async function putBucketTransferAcceleration(
  this: TOSBase,
  input: PutBucketTransferAccelerationInput
) {
  const { bucket, ...otherProps } = input;

  const body = convertNormalCamelCase2Upper(otherProps);
  return this.fetchBucket<PutBucketTransferAccelerationOutput>(
    bucket,
    'PUT',
    { [CommonQueryKey]: '' },
    {},
    {
      ...body,
    }
  );
}

export interface GetBucketTransferAccelerationInput {
  bucket?: string;
  getStatus?: boolean;
}

export interface GetBucketTransferAccelerationOutput {
  TransferAccelerationConfiguration: {
    Enabled: 'true' | 'false';
    Status: TransferAccelerationStatusType;
  };
}

/**
 * @private unstable
 */
export async function getBucketTransferAcceleration(
  this: TOSBase,
  input: GetBucketTransferAccelerationInput
) {
  try {
    const { bucket } = input;
    const headers: Headers = {};
    if (input.getStatus) {
      headers['x-tos-get-bucket-acceleration-status'] = 'true';
    }
    const res = await this.fetchBucket<GetBucketTransferAccelerationOutput>(
      bucket,
      'GET',
      { [CommonQueryKey]: '' },
      headers
    );
    return res;
  } catch (error) {
    return handleEmptyServerError<GetBucketTransferAccelerationOutput>(error, {
      enableCatchEmptyServerError: this.opts.enableOptimizeMethodBehavior,
      methodKey: 'getBucketTransferAcceleration',
      defaultResponse: {
        TransferAccelerationConfiguration: {
          Enabled: 'false',
          Status: TransferAccelerationStatusType.Terminated,
        },
      },
    });
  }
}
