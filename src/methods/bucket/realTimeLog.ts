import { convertNormalCamelCase2Upper } from '../../utils';
import TOSBase from '../base';

const CommonQueryKey = 'realtimeLog';

interface AccessLogConfiguration {
  UseServiceTopic: boolean;
  TLSProjectID?: string;
  TLSTopicID?: string;
}

interface RealTimeLogConfiguration {
  Role: string;
  AccessLogConfiguration: AccessLogConfiguration;
}

export interface PutBucketRealTimeLogInput {
  bucket: string;
  realTimeLogConfiguration: RealTimeLogConfiguration;
}

export interface PutBucketRealTimeLogOutput {}

export async function putBucketRealTimeLog(
  this: TOSBase,
  input: PutBucketRealTimeLogInput
) {
  const { bucket, ...otherProps } = input;

  const body = convertNormalCamelCase2Upper(otherProps);
  return this.fetchBucket<PutBucketRealTimeLogOutput>(
    bucket,
    'PUT',
    { [CommonQueryKey]: '' },
    {},
    {
      ...body,
    }
  );
}

export interface GetBucketRealTimeLogInput {
  bucket: string;
}

export interface GetBucketRealTimeLogOutput {
  RealTimeLogConfiguration: RealTimeLogConfiguration;
}

export async function getBucketRealTimeLog(
  this: TOSBase,
  input: GetBucketRealTimeLogInput
) {
  const { bucket } = input;

  return this.fetchBucket<GetBucketRealTimeLogOutput>(
    bucket,
    'GET',
    { [CommonQueryKey]: '' },
    {}
  );
}

export interface DeleteBucketRealTimeLogInput {
  bucket: string;
}

export interface DeleteBucketRealTimeLogOutput {}

export async function deleteBucketRealTimeLog(
  this: TOSBase,
  input: DeleteBucketRealTimeLogInput
) {
  const { bucket } = input;

  return this.fetchBucket<DeleteBucketRealTimeLogOutput>(
    bucket,
    'DELETE',
    { [CommonQueryKey]: '' },
    {}
  );
}
