import TOSBase from '../base';
import { GetBucketLifecycleInput } from './lifecycle';
import { handleEmptyServerError } from '../../handleEmptyServerError';

export interface PutBucketAccessMonitorInput {
  bucket: string;
  status: 'Enabled' | 'Disabled';
}

export interface PutBucketAccessMonitorOutput {}

/**
 * @private unstable method
 */
export async function putBucketAccessMonitor(
  this: TOSBase,
  input: PutBucketAccessMonitorInput
) {
  const { bucket, status } = input;

  return this.fetchBucket<PutBucketAccessMonitorOutput>(
    bucket,
    'PUT',
    { accessmonitor: '' },
    {},
    {
      Status: status,
    }
  );
}

export interface GetBucketAccessMonitorInput {
  bucket: string;
}

export interface GetBucketAccessMonitorOutput {
  Status?: 'Enabled' | 'Disabled';
}

/**
 * @private unstable method
 */
export async function getBucketAccessMonitor(
  this: TOSBase,
  input: GetBucketLifecycleInput
) {
  try {
    const { bucket } = input;

    return await this.fetchBucket<GetBucketAccessMonitorOutput>(
      bucket,
      'GET',
      { accessmonitor: '' },
      {}
    );
  } catch (error) {
    return handleEmptyServerError<GetBucketAccessMonitorOutput>(error, {
      enableCatchEmptyServerError: this.opts.enableOptimizeMethodBehavior,
      methodKey: 'getBucketAccessMonitor',
      defaultResponse: {},
    });
  }
}
