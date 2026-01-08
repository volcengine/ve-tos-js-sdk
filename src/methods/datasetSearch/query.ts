import TOSBase from "../base";
import { FileType } from "./type";
import { filterUndefined } from "../utils";


/**
 * 操作运算符枚举
 * 定义查询条件中支持的逻辑运算符和比较运算符
 */
export enum Operator {
  /** 逻辑非 */
  NOT = 'not',

  /** 逻辑或 - 用于多个条件的或关系 */
  OR = 'or',

  /** 逻辑与 - 用于多个条件的与关系 */
  AND = 'and',

  /** 小于 - 数值比较 */
  LT = 'lt',

  /** 小于等于 - 数值比较 */
  LTE = 'lte',

  /** 大于 - 数值比较 */
  GT = 'gt',

  /** 大于等于 - 数值比较 */
  GTE = 'gte',

  /** 等于 - 精确匹配 */
  EQ = 'eq',

  /** 存在性查询 - 检查字段是否存在 */
  EXIST = 'exist',

  /** 前缀查询 - 匹配字段值的前缀 */
  PREFIX = 'prefix',

  /** 字符串匹配查询 - 短语精确匹配 */
  MATCH_PHRASE = 'match-phrase',

  /** 嵌套查询 - 字段为数组时，同一对象内的逻辑条件查询 */
  // NESTED = 'nested',
}


export interface Query {
  Operation: Operator;
  Field?: string;
  Value?: string;
  SubQueries?: Query[];
}

export enum AGGREGATION_OPERATION {
  MIN = 'min',
  MAX = 'max',
  AVERAGE = 'average',
  SUM = 'sum',
  COUNT = 'count',
  DISTINCT = 'distinct',
  GROUP = 'group',
}


export interface Group {
  Value: string;
  Count: number;
}


export interface AggregationsRes {
  Field: string;
  Operation: string;
  Value?: number;
  Groups?: Group[];
}

export interface AggregationsParams {
  Field?: string;
  Operation?: AGGREGATION_OPERATION;
}


/**
 * 简单查询参数接口
 * @interface DatasetSimpleQueryParams
 * @property {string} DatasetName - 数据集名称（必选）
 * @property {Query} [Query] - 查询参数条件（可选）
 * @property {string} [Sort] - 排序字段列表（可选）
 * @property {string} [Order] - 排序方式（可选）
 * @property {number} [MaxResults] - 返回结果最大个数（可选）
 * @property {string} [NextToken] - 翻页token（可选）
 * @property {Aggregations[]} [Aggregations] - 聚合字段信息列表（可选）
 * @property {string[]} [WithFields] - 仅返回特定字段（可选）
 */
export interface DatasetSimpleQueryParams {
  accountId: string;
  /** 数据集名称，同一个账户下唯一 */
  DatasetName: string;
  
  /** 查询参数条件，可包含 SubQueries */
  Query?: Query;
  
  /**
   * 排序字段列表
   * @example "Size,Filename"
   * @description 多个排序字段可使用半角逗号分隔，最多可设置5个排序字段
   */
  Sort?: string;
  
  /**
   * 排序方式
   * @example "asc,desc"
   * @description 取值为asc（升序）或desc（降序，默认），排序方式数量需小于等于排序字段数量
   */
  Order?: string;
  
  /**
   * 返回结果最大个数
   * @description 不传Aggregations时：0~100，默认100；传Aggregations时：0~2000
   */
  MaxResults?: number;
  
  /**
   * 翻页token
   * @description 第一次调用时设置为空，后续使用返回的NextToken
   */
  NextToken?: string;
  
  /**
   * 聚合字段信息列表
   * @description 聚合查询时仅返回聚合结果，不返回元信息列表，不允许传入重复的Aggregation
   */
  Aggregations?: AggregationsParams[];
  
  /**
   * 仅返回特定字段
   * @description 不填则返回所有字段，需根据模板包含的字段进行校验
   */
  WithFields?: string[];
}


export type ObjectFile = FileType;

export interface DatasetSimpleQueryOutput {
  /** 请求 ID */
  RequestId: string;
  /**
   * 翻页标记
   * 当文件总数大于设置的MaxResults时返回，用于下一次翻页请求
   */
  NextToken?: string;
  /**
   * 聚合字段信息列表
   * 仅在请求的Aggregations不为空时返回
   */
  Aggregations?: AggregationsRes[];
  /**
   * 对象信息列表
   * 仅在请求的Aggregations为空时返回
   */
  Files?: ObjectFile[];
}

export async function datasetSimpleQuery(
  this: TOSBase,
  input: DatasetSimpleQueryParams
) {
  const { accountId, ...rest } = input;
  const res = await this.fetch<DatasetSimpleQueryOutput>(
    'POST',
    '/datasetquery',
    {mode: 'SimpleQuery'},
    {
      'x-tos-account-id': accountId,
    },
    filterUndefined(rest)
  );
  return res;
}




/**
 * 语义搜索类型枚举
 */
export enum SEMANTIC_QUERY_TYPE {
  TEXT = 'text',
  IMAGE = 'image',
}

/**
 * 语义搜索请求参数
 * @interface DatasetSemanticQueryParams
 */
export interface DatasetSemanticQueryParams {
  accountId: string;
  /**
   * 数据集名称，同一个账户下唯一
   */
  DatasetName: string;
  /**
   * 语义搜索输入内容
   * - 当SemanticQueryType为text时，为搜索的自然语言语义
   * - 当SemanticQueryType为image时，为图片url
   */
  SemanticQueryInput: string;
  /**
   * 语义搜索类型
   * - text：以文搜图，最大支持60字符
   * - image：以图搜图
   * @default text
   */
  SemanticQueryType?: SEMANTIC_QUERY_TYPE;
  /**
   * 查询参数条件，可包含SubQueries
   * @constraints 子查询条件最大支持设置100个，子查询嵌套深度最多支持5层
   */
  Query?: Query;
  /**
   * 返回文件元数据的最大个数
   * @default 100
   * @constraints 取值范围为0~100
   */
  MaxResults?: number;
  /**
   * 仅返回特定字段的值
   * @constraints 只支持标量字段和支持操作符列表中支持的字段
   */
  WithFields?: string[];
}

/**
 * 语义搜索响应结果
 * @interface DatasetSemanticQueryOutput
 */
export interface DatasetSemanticQueryOutput {
  /**
   * 本次请求的RequestId
   */
  RequestId: string;
  /**
   * 查询到的文件列表
   * @description 仅在请求的Aggregations为空时返回
   */
  Files?: ObjectFile[];
}

export async function datasetSemanticQuery(
  this: TOSBase,
  input: DatasetSemanticQueryParams
) {
  const { accountId, ...rest } = input;
  const res = await this.fetch<DatasetSemanticQueryOutput>(
    'POST',
    '/datasetquery',
    { mode: 'SemanticQuery'},
    {
      'x-tos-account-id': accountId,
    },
    filterUndefined(rest)
  );
  return res;
}
