import { convertNormalCamelCase2Upper } from '../../utils';
import { handleEmptyServerError } from '../../handleEmptyServerError';
import TOSBase from '../base';

const CommonQueryKey = 'notification_v2';

export interface NotificationFilter {
  TOSKey?: {
    FilterRules: {
      Name: string;
      Value: string;
    }[];
  };
}

export interface DestinationRocketMQ {
  Role: string;
  InstanceId: string;
  Topic: string;
  AccessKeyId: string;
  Region?: string;
}

/**
 *  @private unstable
 */
export interface DestinationKafka {
  Role: string;
  InstanceId: string;
  Topic: string;
  User: string;
  Region?: string;
}

interface DestinationHttpServer {
  Url: string;
}

export interface NotificationDestination {
  RocketMQ?: DestinationRocketMQ[];
  VeFaaS?: { FunctionId: string }[];
  Kafka?: DestinationKafka[];
  HttpServer?: DestinationHttpServer[];
}

export interface NotificationRule {
  RuleId: string;
  Events: string[];
  Filter?: NotificationFilter;
  Destination: NotificationDestination;
}

export interface PutBucketNotificationInput {
  bucket: string;
  Rules: NotificationRule[];
  Version?: string;
}

export interface PutBucketNotificationOutput {}

export async function putBucketNotificationType2(
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
  Rules: NotificationRule[];
  Version?: string;
}

export async function getBucketNotificationType2(
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
      methodKey: 'getBucketNotificationType2',
      defaultResponse: {
        Rules: [],
      },
    });
  }
}
