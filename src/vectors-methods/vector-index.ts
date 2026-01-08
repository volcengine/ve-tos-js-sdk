import { DataType, DistanceMetricType } from '../TosExportEnum';
import { TosVectorsClient } from '../TosVectorsClient';
import { Headers } from '../interface';

export interface MetadataConfiguration {
  nonFilterableMetadataKeys: string[];
}

export interface CreateIndexInput {
  vectorBucketName: string;
  accountID: string;
  indexName: string;
  dataType?: DataType;
  dimension?: number;
  distanceMetric?: DistanceMetricType;
  metadataConfiguration?: MetadataConfiguration;
}

export interface CreateIndexOutput {}

export async function createIndex(
  this: TosVectorsClient,
  input: CreateIndexInput
) {
  const { vectorBucketName, accountID } = input;
  // 根据 input 构造 query
  const query = {};
  // 根据 input 构造 header
  const header = {};
  // 根据 input 构造 body
  const body = {
    dataType: input.dataType,
    dimension: input.dimension,
    distanceMetric: input.distanceMetric,
    indexName: input.indexName,
    metadataConfiguration: input.metadataConfiguration,
    vectorBucketName: input.vectorBucketName,
  };

  // 调用 TOS 服务的 API 函数
  const res = await this.fetchVectors<CreateIndexOutput>(
    'POST',
    '/CreateIndex',
    query,
    header,
    body,
    {
      bucket: vectorBucketName,
      accountId: accountID,
    }
  );

  return res;
}

export interface DeleteIndexInput {
  vectorBucketName: string;
  accountID: string;
  indexName?: string;
}

export interface DeleteIndexOutput {}

export async function deleteIndex(
  this: TosVectorsClient,
  input: DeleteIndexInput
) {
  const { vectorBucketName, accountID } = input;
  // 根据 input 构造 query
  const query = {};
  // 根据 input 构造 header
  const header = {};
  // 根据 input 构造 body
  const body = {
    indexName: input.indexName,
    vectorBucketName: input.vectorBucketName,
  };

  // 调用 TOS 服务的 API 函数
  const res = await this.fetchVectors<DeleteIndexOutput>(
    'POST',
    '/DeleteIndex',
    query,
    header,
    body,
    {
      bucket: vectorBucketName,
      accountId: accountID,
    }
  );
  res.data = {};
  return res;
}

export interface IndexSummary {
  creationTime: number;
  indexName: string;
  indexTrn: string;
  vectorBucketName: string;
}

export interface ListIndexesInput {
  vectorBucketName: string;
  maxResults?: number;
  nextToken?: string;
  prefix?: string;
  accountID: string;
}

export interface ListIndexesOutput {
  nextToken: string;
  indexes: IndexSummary[];
}

export async function listIndexes(
  this: TosVectorsClient,
  input: ListIndexesInput
) {
  const { vectorBucketName, accountID } = input;
  // 根据 input 构造 query
  const query = {};
  // 根据 input 构造 header
  const header = {};
  // 根据 input 构造 body
  const body = {
    vectorBucketName: input.vectorBucketName,
    maxResults: input.maxResults,
    nextToken: input.nextToken,
    prefix: input.prefix,
  };

  // 调用 TOS 服务的 API 函数
  const res = await this.fetchVectors<ListIndexesOutput>(
    'POST',
    '/ListIndexes',
    query,
    header,
    body,
    {
      bucket: vectorBucketName,
      accountId: accountID,
    }
  );

  return res;
}

export interface GetIndexInput {
  vectorBucketName: string;
  accountID: string;
  indexName: string;
}

export interface GetIndexOutput {
  index: Index;
}

export interface Index {
  creationTime: number;
  dataType: DataType;
  dimension: number;
  distanceMetric: DistanceMetricType;
  metadataConfiguration: MetadataConfiguration;
  indexName: string;
  indexTrn: string;
  vectorBucketName: string;
}

export async function getIndex(this: TosVectorsClient, input: GetIndexInput) {
  const headers: Headers = {};

  const body = {
    indexName: input.indexName,
    vectorBucketName: input.vectorBucketName,
  };

  const res = await this.fetchVectors<GetIndexOutput>(
    'POST',
    '/GetIndex',
    {},
    headers,
    body,
    { accountId: input.accountID, bucket: input.vectorBucketName }
  );

  return res;
}
