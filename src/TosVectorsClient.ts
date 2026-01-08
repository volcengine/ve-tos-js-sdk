import { Method } from 'axios';
import { TosClientCommonOptions, Headers } from './interface';
import TOSBase, { TosResponse } from './methods/base';
import {
  createVectorBucket,
  listVectorBuckets,
  getVectorBucket,
  deleteVectorBucket,
  putVectorBucketPolicy,
  getVectorBucketPolicy,
  deleteVectorBucketPolicy,
} from './vectors-methods/base';
import { createIndex, deleteIndex, getIndex, listIndexes } from './vectors-methods/vector-index';
import { putVectors, listVectors, getVectors, deleteVectors, queryVectors } from './vectors-methods/vectors';
import { isValidAccountId, isValidBucketName, isValidVectorBucketName } from './utils';

export interface TosVectorsClientOptions extends TosClientCommonOptions {}

export class TosVectorsClient extends TOSBase {
  constructor(options: TosVectorsClientOptions) {
    super(options);
  }
  private serviceName = 'tosvectors';
  createVectorBucket = createVectorBucket;
  listVectorBuckets = listVectorBuckets;
  getVectorBucket = getVectorBucket;
  deleteVectorBucket = deleteVectorBucket;
  putVectorBucketPolicy = putVectorBucketPolicy;
  getVectorBucketPolicy = getVectorBucketPolicy;
  deleteVectorBucketPolicy = deleteVectorBucketPolicy;
  createIndex = createIndex;
  deleteIndex = deleteIndex;
  getIndex = getIndex;
  listIndexes = listIndexes;

  putVectors = putVectors;
  listVectors = listVectors;
  getVectors = getVectors;
  deleteVectors = deleteVectors;
  queryVectors = queryVectors;

  protected async fetchVectors<Data>(
    method: Method,
    path: string,
    query: Record<string, any>,
    headers: Headers,
    body?: Object | File | Blob | NodeJS.ReadableStream,
    opts?: {
      bucket?: string;
      accountId?: string;
    }
  ): Promise<TosResponse<Data>> {
    if (opts?.bucket !== undefined) {
      isValidVectorBucketName(opts?.bucket);
    }
    if (opts?.accountId !== undefined) {
      isValidAccountId(opts?.accountId);
    }

    return this.fetch(method, path, query, headers, body, {
      serviceName: this.serviceName,
      subdomainBucket: opts?.accountId
        ? `${opts?.bucket}-${opts?.accountId}`
        : undefined,
    });
  }
}
