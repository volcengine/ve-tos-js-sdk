import { convertNormalCamelCase2Upper } from '../../utils';
import { handleEmptyServerError } from '../../handleEmptyServerError';
import TOSBase from '../base';

const CommonQueryKey = 'notification';

export interface Filter {
  TOSKey?: {
    FilterRules: {
      Name: string;
      Value: string;
    }[];
  };
}
interface CloudFunctionConfiguration {
  Events: string[];
  Filter?: Filter;
  RuleId?: string;
  CloudFunction: string;
}

export interface RocketMQConf {
  InstanceId: string;
  Topic: string;
  AccessKeyId: string;
}
export interface RocketMQConfiguration {
  RuleId: string;
  Role: string;
  Events: string[]; // 支持的值在不断增加，不定义成枚举
  Filter?: Filter;
  RocketMQ: RocketMQConf;
}

export interface PutBucketNotificationInput {
  bucket: string;
  cloudFunctionConfigurations?: CloudFunctionConfiguration[];
  rocketMQConfigurations?: RocketMQConfiguration[];
}

export interface PutBucketNotificationOutput {}

/**
 * @deprecated use PutBucketNotificationType2 instead
 */
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
  RocketMQConfigurations: RocketMQConfiguration[];
}

/**
 * @deprecated use GetBucketNotificationType2 instead
 */
export async function getBucketNotification(
  this: TOSBase,
  input: GetBucketNotificationInput
) {
  const { bucket } = input;
  try {
    return await this.fetchBucket<GetBucketNotificationOutput>(
      bucket,
      'GET',
      { [CommonQueryKey]: '' },
      {}
    );
  } catch (error) {
    return handleEmptyServerError<GetBucketNotificationOutput>(error, {
      enableCatchEmptyServerError: this.opts.enableOptimizeMethodBehavior,
      methodKey: 'getBucketNotification',
      defaultResponse: {
        CloudFunctionConfigurations: [],
        RocketMQConfigurations: [],
      },
    });
  }
}
