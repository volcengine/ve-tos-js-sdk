import { TosVectorsClient } from '../TosVectorsClient';

export interface PutVectorsInput {
  vectorBucketName: string;
  accountID: string;
  indexName: string;
  vectors: Vector[];
}

export interface PutVectorsOutput {}

export interface ListVectorsInput {
  vectorBucketName: string;
  indexName: string;
  accountID: string;
  maxResults?: number;
  nextToken?: string;
  returnData?: boolean;
  returnMetadata?: boolean;
}

export interface ListVectorsOutput {
  nextToken?: string;
  vectors: Vector[];
}

export interface GetVectorsInput {
  vectorBucketName: string;
  accountID: string;
  indexName: string;
  keys: string[];
  returnData?: boolean;
  returnMetadata?: boolean;
}

export interface GetVectorsOutput {
  vectors: Vector[];
}

export interface DeleteVectorsInput {
  vectorBucketName: string;
  accountID: string;
  indexName: string;
  keys: string[];
}

export interface DeleteVectorsOutput {}

export interface QueryVectorsInput {
  vectorBucketName: string;
  accountID: string;
  indexName: string;
  returnDistance?: boolean;
  returnMetadata?: boolean;
  topK: number;
  queryVector: VectorData;
  filter?: { [key: string]: any };
}

export interface QueryVectorsOutput {
  vectors: DistanceVector[];
}

export interface DistanceVector {
  key: string;
  data: VectorData;
  distance: number;
  metadata: { [key: string]: any };
}

export interface Vector {
  key: string;
  data?: VectorData;
  metadata?: Record<string, any>;
}

export interface VectorData {
  float32?: number[];
}

export async function putVectors(
  this: TosVectorsClient,
  input: PutVectorsInput
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
    vectors: input.vectors,
  };

  // 调用 TOS 服务的 API 函数
  const res = await this.fetchVectors<PutVectorsOutput>(
    'POST',
    '/PutVectors',
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

export async function listVectors(
  this: TosVectorsClient,
  input: ListVectorsInput
) {
  const { vectorBucketName, accountID } = input;
  // 根据 input 构造 query
  const query = {};
  // 根据 input 构造 header
  const header = {};
  // 根据 input 构造 body
  const body = {
    indexName: input.indexName,
    maxResults: input.maxResults,
    nextToken: input.nextToken,
    returnData: input.returnData,
    returnMetadata: input.returnMetadata,
    vectorBucketName: input.vectorBucketName,
  };

  // 调用 TOS 服务的 API 函数
  const res = await this.fetchVectors<ListVectorsOutput>(
    'POST',
    '/ListVectors',
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

export async function getVectors(
  this: TosVectorsClient,
  input: GetVectorsInput
) {
  const { vectorBucketName, accountID } = input;
  // 根据 input 构造 query
  const query = {};
  // 根据 input 构造 header
  const header = {};
  // 根据 input 构造 body
  const body = {
    indexName: input.indexName,
    keys: input.keys,
    returnData: input.returnData,
    returnMetadata: input.returnMetadata,
    vectorBucketName: input.vectorBucketName,
  };

  // 调用 TOS 服务的 API 函数
  const res = await this.fetchVectors<GetVectorsOutput>(
    'POST',
    '/GetVectors',
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

export async function deleteVectors(
  this: TosVectorsClient,
  input: DeleteVectorsInput
) {
  const { vectorBucketName, accountID } = input;
  // 根据 input 构造 query
  const query = {};
  // 根据 input 构造 header
  const header = {};
  // 根据 input 构造 body
  const body = {
    indexName: input.indexName,
    keys: input.keys,
    vectorBucketName: input.vectorBucketName,
  };

  // 调用 TOS 服务的 API 函数
  const res = await this.fetchVectors<DeleteVectorsOutput>(
    'POST',
    '/DeleteVectors',
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

export async function queryVectors(
  this: TosVectorsClient,
  input: QueryVectorsInput
) {
  const { vectorBucketName, accountID } = input;

  const query: Record<string, any> = {};

  const headers = {};

  const body = {
    vectorBucketName: input.vectorBucketName,
    indexName: input.indexName,
    returnDistance: input.returnDistance,
    returnMetadata: input.returnMetadata,
    topK: input.topK,
    queryVector: input.queryVector,
    filter: input.filter,
  };

  const res = await this.fetchVectors<QueryVectorsOutput>(
    'POST',
    '/QueryVectors',
    query,
    headers,
    body,
    { bucket: vectorBucketName, accountId: accountID }
  );

  return res;
}
