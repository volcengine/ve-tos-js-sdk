import TOSBase from "../base";
import { filterUndefined } from "../utils";


export enum DatasetTemplateId {
  BasicInfoTemplate = 'basic_info_template',
  ImageSemanticTemplate = 'image_semantic_template',
}
/**
 * 数据集创建入参定义
 */
export interface CreateDatasetParams {
  accountId: string;
  /**
   * Dataset的名字
   * @required 是
   * @constraints 长度为1~128字符，只能包含英文字母、数字、短划线(-)和下划线(_)，必须以英文字母或下划线开头
   */
  DatasetName: string;

  /**
   * 数据集的描述
   * @required 是
   * @constraints 长度不能超过256个字符
   */
  Description: string;

  /**
   * 模版ID
   * @required 是
   * @enum basic_info_template: 基础信息模版，只可以做标量查询
   * @enum image_semantic_template: 图片语义模板，可以做标量+图片向量（语义查询+以图搜图）混合查询
   */
  TemplateId: DatasetTemplateId;
  Region?: string;
}

/**
 * Dataset详细信息定义
 */
export interface Dataset {
  /** Dataset的名字 */
  DatasetName: string;
  /** 已绑定的Bucket个数 */
  BindCount: number;
  /** 数据集创建时间，RFC3339Nano 格式 */
  CreateTime: string;
  /** 数据集最近一次更新时间，RFC3339Nano 格式 */
  UpdateTime: string;
  /** 数据集的描述 */
  Description: string;
  /** 数据集中已索引的对象数量 */
  FileCount: number;
  /** 数据集中已索引的对象大小 */
  TotalFileSize: number;
  /** 模版ID */
  TemplateId: string;
  Region?: string;
}

/**
 * 创建Dataset接口的正常返回类型
 */
export interface CreateDatasetOutput {
  /** 本次请求的RequestId */
  RequestId: string;
  /** Dataset详细信息 */
  Dataset: Dataset;
}
/**
 * 创建Dataset接口
 * @param this TOSBase实例
 * @param input CreateDatasetParams
 * @returns CreateDatasetOutput
 * @private unstable 暂不对外
 */
export async function createDataset(
  this: TOSBase,
  input: CreateDatasetParams
) {
  const { accountId, ...rest } = input;
  const res = await this.fetch<CreateDatasetOutput>(
    'POST',
    '/dataset',
    {},
    {
      'x-tos-account-id': accountId,
    },
    filterUndefined(rest),
    {}
  );
  return res;
}


export interface GetDatasetParams {
  datasetname: string;
  accountId: string;
}

export interface GetDatasetOutput {
  RequestId: string;
  Dataset: Dataset;
}

/**
 * 获取Dataset接口
 * @param this TOSBase实例
 * @param input GetDatasetParams
 * @returns GetDatasetOutput
 * @private unstable 暂不对外
 */
export async function getDataset(
  this: TOSBase,
  input: GetDatasetParams
) {
  const { datasetname, accountId } = input;
  const res = await this.fetch<GetDatasetOutput>(
    'GET',
    '/dataset',
    {datasetname},
    {
      'x-tos-account-id': accountId,
    },
  );
  return res;
}

/**
 * 删除Dataset接口入参定义
 */
export interface DeleteDatasetParams {
  accountId: string;
  /**
   * Dataset的名字
   * @required 是
   */
  datasetname: string;
}

/**
 * 删除Dataset接口返回类型
 */
export interface DeleteDatasetOutput {
  /** 本次请求的RequestId */
  RequestId: string;
  /** 删除的Dataset的名字 */
  Dataset: Dataset;
}

/**
 * 删除Dataset接口
 * @param this TOSBase实例
 * @param input DeleteDatasetParams
 * @returns DeleteDatasetOutput
 * @private unstable 暂不对外
 */
export async function deleteDataset(
  this: TOSBase,
  input: DeleteDatasetParams
) {
  const { accountId, datasetname } = input;
  const res = await this.fetch<DeleteDatasetOutput>(
    'DELETE',
    '/dataset',
    { datasetname },
    {
      'x-tos-account-id': accountId,
    }
  );
  return res;
}

/**
 * 列举数据集请求参数
 * @interface ListDatasetParams
 * @property {number} [maxresults] - 返回数据集的最大个数，不填默认为100，取值范围为0~100
 * @property {string} [prefix] - 数据集名称前缀，不填默认为""
 * @property {string} [nexttoken] - 翻页marker，不填默认为""
 */
export interface ListDatasetParams {
  accountId: string;
  maxresults?: number;
  prefix?: string;
  nexttoken?: string;
}

/**
 * 列举数据集响应结果
 * @interface ListDatasetOutput
 * @property {string} RequestId - 本次请求request id
 * @property {string} [NextToken] - 翻页marker，为空说明列举完毕
 * @property {Dataset[]} Datasets - 数据集列表
 */
export interface ListDatasetOutput {
  RequestId: string;
  NextToken?: string;
  Datasets: Dataset[];
}
/**
 * 列举数据集接口
 * @param this TOSBase实例
 * @param input ListDatasetParams
 * @returns ListDatasetOutput
 * @private unstable 暂不对外
 */
export async function listDataset(
  this: TOSBase,
  input: ListDatasetParams
) {
  const { accountId, ...rest } = input;
  const res = await this.fetch<ListDatasetOutput>(
    'GET',
    '/datasets',
    filterUndefined(rest),
    {
      'x-tos-account-id': accountId,
    }
  );
  return res;
}
