import TOSBase from '../base';
import { paramsSerializer } from '../../utils';

export interface IMetaData {
  accountId: string;
}

export interface StorageLensInput extends IMetaData {
  Id: string;
}
interface IStrategy {
  Buckets: {
    Bucket: string[];
  };
  Regions: {
    Region: string[];
  };
}

interface IPrefixLevel {
  StorageMetrics: {
    IsEnabled: boolean;
    SelectionCriteria: {
      MaxDepth?: number;
      MinStorageBytesPercentage?: number;
      Delimiter: string;
      Prefixes?: string[];
    };
  };
}
export interface StorageLensConfigurationInput extends StorageLensInput {
  Region: string;
  IsEnabled: boolean;
  AccountLevel: {
    BucketLevel: {
      /** @deprecated will be removed soon */
      ActivityMetrics?: {
        IsEnabled: boolean;
      };
      HotStatsMetrics?: {
        IsEnabled: boolean;
        Actions: string[]; //当前默认前端传这个，方便后期扩action
      };
      PrefixLevel?: IPrefixLevel;
    };
  };
  DataExport?: {
    BucketDestination?: {
      Bucket: string;
      Prefix?: string;
      OutputSchemaVersion: string;
      Format: string;
      Role: string;
    };
  };
  Include?: IStrategy;
  Exclude?: IStrategy;
}
export type StorageLensConfigurationOutput = StorageLensConfigurationInput;

/**
 * @private unstable method
 * @description 获取数据透视列表
 * @param params
 * @returns
 */
export async function listStorageLens(this: TOSBase, params: IMetaData) {
  const { accountId } = params;
  const res = await this.fetch<StorageLensConfigurationOutput[]>(
    'GET',
    '/storagelens',
    {},
    {
      'x-tos-account-id': accountId,
    },
    {},
    {
      axiosOpts: {
        paramsSerializer,
      },
    }
  );
  return res;
}

/**
 * @private unstable method
 * @description 删除数据透视记录
 * @param params
 * @returns
 */
export async function deleteStorageLens(
  this: TOSBase,
  params: StorageLensInput
) {
  const { accountId, Id } = params;
  const res = await this.fetch(
    'DELETE',
    `/storagelens`,
    {
      id: Id,
    },
    {
      'x-tos-account-id': accountId,
    },
    {},
    {
      needMd5: true,
    }
  );
  return res;
}

/**
 * @private unstable method
 * @description 获取数据透视详情
 * @param params
 * @returns
 */
export async function getStorageLens(this: TOSBase, params: StorageLensInput) {
  const { accountId, Id } = params;
  const res = await this.fetch<StorageLensConfigurationOutput>(
    'GET',
    `/storagelens`,
    {
      id: Id,
    },
    {
      'x-tos-account-id': accountId,
    },
    {},
    {
      needMd5: true,
    }
  );
  return res;
}
/**
 * @private unstable method
 * @description 提交数据透视记录
 * @param params
 * @returns
 */
export async function putStorageLens(
  this: TOSBase,
  params: StorageLensConfigurationInput
) {
  const { accountId, Id, ...rest } = params;

  const res = await this.fetch(
    'PUT',
    `/storagelens`,
    {
      id: Id,
    },
    {
      'x-tos-account-id': accountId,
    },
    {
      ...rest,
      Id,
    },
    {
      needMd5: true,
    }
  );
  return res;
}
