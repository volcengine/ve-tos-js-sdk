import { handleEmptyServerError } from '../../handleEmptyServerError';
import TOSBase, { TosResponse } from '../base';

/**
 * 清单文件导出周期
 */
export enum ScheduleFrequency {
  /** 按天 */
  Daily = 'Daily',
  /** 按周 */
  Weekly = 'Weekly',
}

/**
 * 清单包含Object版本信息值
 */
export enum IncludedObjectVersions {
  /** 全部 */
  All = 'All',
  /** 当前版本 */
  Current = 'Current',
}

/**
 * 清单配置项
 */
export enum InventoryOptionalFields {
  /** Object的大小 */
  Size = 'Size',
  /** Object的最后修改时间 */
  LastModifiedDat = 'LastModifiedDate',
  /** 标识Object的内容 */
  ETag = 'ETag',
  /** Object的存储类型 */
  StorageClass = 'StorageClass',
  /** 是否为通过分片上传的Object */
  IsMultipartUploaded = 'IsMultipartUploaded',
  /** Object是否加密 */
  EncryptionStatus = 'EncryptionStatus',
  CRC64 = 'CRC64',
  /** crr复制状态 */
  ReplicationStatus = 'ReplicationStatus',
}

/**
 * 桶清单
 */
export interface BucketInventoryItem {
  /** 清单名称 */
  Id: string;
  /** 清单功能是否启用 */
  IsEnabled: boolean;
  /** 清单筛选的前缀 */
  Filter?: {
    /** 筛选规则的匹配前缀 */
    Prefix?: string;
  };
  /** 存放清单结果 */
  Destination: {
    /** Bucket 信息 */
    TOSBucketDestination: {
      /** 清单文件的文件格式 */
      Format: string;
      /** Bucket 所有者授予的账户ID */
      AccountId: string;
      /** 角色名称 */
      Role: string;
      /** 存放导出的清单文件的 Bucket */
      Bucket: string;
      /** 清单文件的存储路径前缀 */
      Prefix?: string;
    };
  };
  /** 存放清单导出周期信息 */
  Schedule: {
    /** 导出的周期 */
    Frequency: ScheduleFrequency;
  };
  /** 是否在清单中包含 Object 版本信息 */
  IncludedObjectVersions: string;
  /** 配置项 */
  OptionalFields?: {
    Field: InventoryOptionalFields[];
  };
}

export interface PutBucketInventoryInput {
  bucket: string;
  inventoryConfiguration: BucketInventoryItem;
}

export interface PutBucketInventoryOutput {}

export interface GetBucketInventoryInput {
  bucket: string;
  id: string;
}

export type GetBucketInventoryOutput = BucketInventoryItem | undefined;
export interface ListBucketInventoryInput {
  bucket: string;
  continuationToken?: string;
}

export interface ListBucketInventoryOutput {
  InventoryConfigurations: BucketInventoryItem[];
  IsTruncated?: boolean;
  NextContinuationToken?: string;
}

export interface DeleteBucketInventoryInput {
  bucket: string;
  id: string;
}

export interface DeleteBucketInventoryOutput {}

/**
 * 获取桶清单详情信息
 */
export async function getBucketInventory(
  this: TOSBase,
  req: GetBucketInventoryInput
): Promise<TosResponse<GetBucketInventoryOutput>> {
  try {
    const res = await this.fetchBucket<GetBucketInventoryOutput>(
      req.bucket,
      'GET',
      {
        inventory: '',
        id: req.id,
      },
      {}
    );

    return res;
  } catch (error) {
    return handleEmptyServerError<GetBucketInventoryOutput>(error, {
      enableCatchEmptyServerError: this.opts.enableOptimizeMethodBehavior,
      methodKey: 'getBucketInventory',
      defaultResponse: undefined,
    });
  }
}

/**
 * 分页获取桶清单信息
 */
export async function listBucketInventory(
  this: TOSBase,
  req: ListBucketInventoryInput
): Promise<TosResponse<ListBucketInventoryOutput>> {
  const params = {
    inventory: '',
    ...(req.continuationToken
      ? { 'continuation-token': req.continuationToken }
      : null),
  };
  try {
    const res = await this.fetchBucket<ListBucketInventoryOutput>(
      req.bucket,
      'GET',
      params,
      {}
    );
    return res;
  } catch (error) {
    return handleEmptyServerError<ListBucketInventoryOutput>(error, {
      enableCatchEmptyServerError: this.opts.enableOptimizeMethodBehavior,
      methodKey: 'listBucketInventory',
      defaultResponse: {
        InventoryConfigurations: [],
      },
    });
  }
}

/**
 * 删除桶清单
 */
export async function deleteBucketInventory(
  this: TOSBase,
  req: DeleteBucketInventoryInput
): Promise<TosResponse<DeleteBucketInventoryOutput>> {
  return this.fetchBucket(
    req.bucket,
    'DELETE',
    { inventory: '', id: req.id },
    {}
  );
}

/**
 * 更新桶清单
 */
export function putBucketInventory(
  this: TOSBase,
  req: PutBucketInventoryInput
): Promise<TosResponse<PutBucketInventoryOutput>> {
  return this.fetchBucket(
    req.bucket,
    'PUT',
    { inventory: '', id: req.inventoryConfiguration.Id },
    {},
    req.inventoryConfiguration
  );
}
