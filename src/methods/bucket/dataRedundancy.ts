import TOSBase from '../base';

const CommonQueryKey = 'redundancyTransition';

export interface PutBucketDataRedundancyTransitionInput {
  bucket?: string;
  targetRedundancyType: 'ZRS' | 'LRS';
}

export interface PutBucketDataRedundancyTransitionOutput {
  TaskId: string;
}

/**
 * @private unstable method
 * 创建桶数据冗余转换任务
 * @param this
 * @param input
 * @returns
 */
export async function createBucketDataRedundancyTransition(
  this: TOSBase,
  input: PutBucketDataRedundancyTransitionInput
) {
  const { bucket, targetRedundancyType } = input;
  return this.fetchBucket<PutBucketDataRedundancyTransitionOutput>(
    bucket,
    'POST',
    {
      [CommonQueryKey]: '',
      'x-tos-target-redundancy-type': targetRedundancyType,
    },
    {},
    {}
  );
}

export interface GetBucketDataRedundancyTransitionInput {
  bucket?: string;
  redundancyTransitionTaskId: string;
}

export interface GetBucketDataRedundancyTransitionOutput {
  TaskId: string;
  CreateTime: string;
  StartTime: string;
  EndTime: string;
  Status: 'Queueing' | 'Processing' | 'Finished';
  EstimatedRemainingTime: number;
  ProcessPercentage: number;
  Bucket: string;
}

/**
 * @private unstable method
 * 根据 taskId 获取桶数据冗余转换任务
 * @param this
 * @param input
 * @returns
 */
export async function getBucketDataRedundancyTransition(
  this: TOSBase,
  input: GetBucketDataRedundancyTransitionInput
) {
  const { bucket, redundancyTransitionTaskId } = input;
  return await this.fetchBucket<GetBucketDataRedundancyTransitionOutput>(
    bucket,
    'GET',
    {
      [CommonQueryKey]: '',
      'x-tos-redundancy-transition-taskid': redundancyTransitionTaskId,
    },
    {}
  );
}

export interface DeleteBucketDataRedundancyTransitionInput {
  bucket?: string;
  redundancyTransitionTaskId: string;
}

export interface DeleteBucketDataRedundancyTransitionOutput {}

/**
 * @private unstable method
 * 根据 taskId 删除桶数据冗余转换任务
 * @param this
 * @param input
 * @returns
 */
export async function deleteBucketDataRedundancyTransition(
  this: TOSBase,
  input: DeleteBucketDataRedundancyTransitionInput
) {
  const { bucket, redundancyTransitionTaskId } = input;

  return this.fetchBucket<DeleteBucketDataRedundancyTransitionOutput>(
    bucket,
    'DELETE',
    {
      [CommonQueryKey]: '',
      'x-tos-redundancy-transition-taskid': redundancyTransitionTaskId,
    },
    {}
  );
}

export interface ListBucketDataRedundancyTransitionInput {
  bucket?: string;
  continuationToken?: string;
  maxKeys: number;
}

export interface ListBucketDataRedundancyTransitionOutput {
  IsTruncated: boolean;
  NextContinuationToken: string;
  BucketDataRedundancyTransition: Array<{
    Bucket: string;
    TaskId: string;
    CreateTime: string;
    StartTime: string;
    EndTime: string;
    Status: 'Queueing' | 'Processing' | 'Finished';
    EstimatedRemainingTime: number;
    ProcessPercentage: number;
  }>;
}

/**
 * @private unstable method
 * 获取桶数据冗余转换任务列表
 * @param this
 * @param input
 * @returns
 */
export async function listBucketDataRedundancyTransition(
  this: TOSBase,
  input: ListBucketDataRedundancyTransitionInput
) {
  const { bucket, maxKeys, continuationToken } = input;

  return this.fetchBucket<ListBucketDataRedundancyTransitionOutput>(
    bucket,
    'GET',
    {
      [CommonQueryKey]: '',
      'max-keys': maxKeys,
      'continuation-token': continuationToken,
    },
    {}
  );
}

export interface GetBucketTransitionEstimatedRemainingTimeInput {
  bucket?: string;
}

export type GetBucketTransitionEstimatedRemainingTimeOutput = number;

/**
 * @private unstable method
 * 获取桶数据冗余转换任务的预估剩余时间
 * @param this
 * @param input
 * @returns
 */
export async function getBucketTransitionEstimatedRemainingTime(
  this: TOSBase,
  input: GetBucketTransitionEstimatedRemainingTimeInput
) {
  const { bucket } = input;

  return this.fetchBucket<GetBucketTransitionEstimatedRemainingTimeOutput>(
    bucket,
    'GET',
    {
      estimatedRemainingTime: '',
    },
    {}
  );
}

export interface ListUserDataRedundancyTransitionInput {
  continuationToken?: string;
  maxKeys: number;
}

/**
 * @private unstable method
 * 获取用户数据冗余转换任务列表
 * @param this
 * @param input
 * @returns
 */
export async function listUserDataRedundancyTransition(
  this: TOSBase,
  input: ListUserDataRedundancyTransitionInput
) {
  const { continuationToken, maxKeys } = input;

  return this.fetch<ListBucketDataRedundancyTransitionOutput>(
    'GET',
    '/',
    {
      [CommonQueryKey]: '',
      'max-keys': maxKeys,
      'continuation-token': continuationToken,
    },
    {}
  );
}
