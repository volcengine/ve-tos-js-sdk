import TOSBase from "../base";
import { filterUndefined } from "../utils";

export enum STOCK_STATE {
  INDEXING = "Indexing",
  DONE = "Done",
  FAILED = "Failed",
}

/**
 * 数据集绑定关系信息定义
 * @interface Binding
 * @property {string} DatasetName - Dataset的名字
 * @property {string} URI - 绑定的Bucket资源URI
 * @property {string} CreateTime - 绑定创建时间，格式为RFC3339Nano
 * @property {string} UpdateTime - 绑定关系修改时间，格式为RFC3339Nano
 * @property {string} State - 绑定关系状态，取值为"Running"
 * @property {string} StockState - 存量索引运行状态，取值为"Indexing"、"Done"或"Failed"
 */
export interface Binding {
  DatasetName: string;
  URI: string;
  CreateTime: string;
  UpdateTime: string;
  State: string;
  StockState: STOCK_STATE;
  EnableStockIndex: boolean;
}

/**
 * 创建数据集绑定关系请求参数
 * @interface CreateDatasetBindingParams
 * @property {string} DatasetName - Dataset的名字，必须是该Account下的DatasetName
 * @property {string} URI - 被绑定资源的URI，必须是该Account下的合法Bucket
 * @property {boolean} [EnableStockIndex] - 是否开启存量索引，默认为false
 */
export interface CreateDatasetBindingParams {
  DatasetName: string;
  URI: string;
  EnableStockIndex?: boolean;
  accountId: string;
}

/**
 * 创建数据集绑定关系响应结果
 * @interface CreateDatasetBindingOutput
 * @property {Binding} Binding - 创建成功的绑定关系信息
 */
export interface CreateDatasetBindingOutput {
  Binding: Binding;
}

/**
 * 创建数据集绑定关系
 * @param this TOSBase实例
 * @param input CreateDatasetBindingParams
 * @returns CreateDatasetBindingOutput
 * @private unstable 暂不对外
 */
export async function createDatasetBinding(
  this: TOSBase,
  input: CreateDatasetBindingParams
) {
  const { accountId, ...rest } = input;
  const res = await this.fetch<CreateDatasetBindingOutput>(
    'POST',
    '/datasetbinding',
    {},
    {
      'x-tos-account-id': accountId,
    },
    filterUndefined(rest),
  );
  return res;
}

/**
 * 删除数据集绑定关系请求参数
 * @interface DeleteDatasetBindingParams
 * @property {string} DatasetName - Dataset的名字，必须是该Account下的DatasetName
 * @property {string} URI - 被绑定资源的URI，必须是该Account下的合法Bucket
 */
export interface DeleteDatasetBindingParams {
  DatasetName: string;
  URI: string;
  accountId: string;
}

/**
 * 删除数据集绑定关系响应结果
 * @interface DeleteDatasetBindingOutput
 * @property {Binding} Binding - 删除成功的绑定关系信息
 */
export interface DeleteDatasetBindingOutput {
  Binding: Binding;
}

/**
 * 删除数据集绑定关系
 * @param this TOSBase实例
 * @param input DeleteDatasetBindingParams
 * @returns DeleteDatasetBindingOutput
 * @private unstable 暂不对外
 */
export async function deleteDatasetBinding(
  this: TOSBase,
  input: DeleteDatasetBindingParams
) {
  const { accountId, ...rest } = input;
  const res = await this.fetch<DeleteDatasetBindingOutput>(
    'DELETE',
    '/datasetbinding',
    {},
    {
      'x-tos-account-id': accountId,
    },
    filterUndefined(rest),
    {}
  );
  return res;
}

/**
 * 查询数据集绑定关系请求参数
 * @interface GetDatasetBindingParams
 * @property {string} datasetname - 待查询的DatasetName
 * @property {string} uri - 查询的绑定Uri
 */
export interface GetDatasetBindingParams {
  datasetname: string;
  uri: string;
  accountId: string;
}

/**
 * 查询数据集绑定关系响应结果
 * @interface GetDatasetBindingOutput
 * @property {Binding} Binding - 查询到的绑定关系信息
 */
export interface GetDatasetBindingOutput {
  Binding: Binding;
}

/**
 * 查询数据集绑定关系
 * @param this TOSBase实例
 * @param input GetDatasetBindingParams
 * @returns GetDatasetBindingOutput
 * @private unstable 暂不对外
 */
export async function getDatasetBinding(
  this: TOSBase,
  input: GetDatasetBindingParams
) {
  const { accountId, ...rest } = input;
  const res = await this.fetch<GetDatasetBindingOutput>(
    'GET',
    '/datasetbinding',
    filterUndefined(rest),
    {
      'x-tos-account-id': accountId,
    },
  );
  return res;
}

/**
 * 列举数据集绑定关系请求参数
 * @interface ListDatasetBindingsParams
 * @property {string} datasetname - 数据集名称
 * @property {number} [maxresults] - 返回数据集的最大个数，取值范围为0~100，默认100
 * @property {string} [nexttoken] - 翻页marker
 */
export interface ListDatasetBindingsParams {
  datasetname: string;
  maxresults?: number;
  nexttoken?: string;
  accountId: string;
}

/**
 * 列举数据集绑定关系响应结果
 * @interface ListDatasetBindingsOutput
 * @property {string} RequestId - 本次请求request id
 * @property {string} [NextToken] - 翻页marker
 * @property {Binding[]} Bindings - 绑定关系列表
 */
export interface ListDatasetBindingsOutput {
  RequestId: string;
  NextToken?: string;
  Bindings: Binding[];
}

/**
 * 列举数据集绑定关系
 * @param this TOSBase实例
 * @param input ListDatasetBindingsParams
 * @returns ListDatasetBindingsOutput
 * @private unstable 暂不对外
 */
export async function listDatasetBindings(
  this: TOSBase,
  input: ListDatasetBindingsParams
) {
  const {
    accountId,
    ...rest
  } = input;
  const res = await this.fetch<ListDatasetBindingsOutput>(
    'GET',
    '/datasetbindings',
    filterUndefined(rest),
    {
      'x-tos-account-id': accountId,
    },
  );
  return res;
}