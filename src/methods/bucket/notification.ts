import { convertNormalCamelCase2Upper } from '../../utils';
import TOSBase from '../base';

const CommonQueryKey = 'notification';

interface CloudFunctionConfiguration {
  Events: string[];
  Filter?: {
    TOSKey?: {
      FilterRules: {
        Name: string;
        Value: string;
      }[];
    };
  };
  RuleId?: string;
  CloudFunction: string;
}

export interface PutBucketNotificationInput {
  bucket: string;
  cloudFunctionConfigurations: CloudFunctionConfiguration[];
}

export interface PutBucketNotificationOutput {}

export async function putBucketNotification(
  this: TOSBase,
  input: PutBucketNotificationInput
) {
  const { bucket, ...otherProps } = input;

  const body = convertNormalCamelCase2Upper(otherProps);
  return this.fetchBucket<PutBucketNotificationOutput>(
    bucket,
    'PUT',
    { [CommonQueryKey]: '' },
    {},
    {
      ...body,
    }
  );
}

export interface GetBucketNotificationInput {
  bucket: string;
}

export interface GetBucketNotificationOutput {
  CloudFunctionConfigurations: CloudFunctionConfiguration[];
}

export async function getBucketNotification(
  this: TOSBase,
  input: GetBucketNotificationInput
) {
  const { bucket } = input;

  return this.fetchBucket<GetBucketNotificationOutput>(
    bucket,
    'GET',
    { [CommonQueryKey]: '' },
    {}
  );
}
