import { Headers } from '../interface';
import { TosVectorsClient } from '../TosVectorsClient';

export interface CreateVectorBucketInput {
  vectorBucketName: string;
}

export interface CreateVectorBucketOutput {}

export async function createVectorBucket(
  this: TosVectorsClient,
  input: CreateVectorBucketInput
) {
  const { vectorBucketName } = input;
  const res = await this.fetchVectors<CreateVectorBucketOutput>(
    'POST',
    '/CreateVectorBucket',
    {},
    {},
    {
      vectorBucketName,
    }
  );
  res.data = {};
  return res;
}

export interface ListVectorBucketsInput {
  prefix?: string;
  nextToken?: string;
  maxResults?: number;
  projectName?: string;
}

export interface VectorBucket {
  creationTime: number;
  vectorBucketTrn: string;
  vectorBucketName: string;
}

export interface ListVectorBucketsOutput {
  nextToken?: string;
  vectorBuckets: VectorBucket[];
}

export async function listVectorBuckets(
  this: TosVectorsClient,
  input: ListVectorBucketsInput
) {
  const { prefix, nextToken, maxResults, projectName } = input;
  const headers: Headers = {};
  if (projectName) {
    headers['x-tos-project-name'] = projectName;
  }

  return this.fetchVectors<ListVectorBucketsOutput>(
    'POST',
    '/ListVectorBuckets',
    {},
    headers,
    {
      prefix,
      nextToken,
      maxResults,
    }
  );
}

export interface GetVectorBucketInput {
  vectorBucketName: string;
  accountID: string;
}

export interface GetVectorBucketOutput {
  vectorBucket: VectorBucket;
}

export async function getVectorBucket(
  this: TosVectorsClient,
  input: GetVectorBucketInput
) {
  const { accountID } = input;
  const query = {};
  const header = {};
  const body = {
    vectorBucketName: input.vectorBucketName,
  };

  const res = await this.fetchVectors<GetVectorBucketOutput>(
    'POST',
    '/GetVectorBucket',
    query,
    header,
    body,
    {
      bucket: input.vectorBucketName,
      accountId: accountID,
    }
  );

  return res;
}

export interface DeleteVectorBucketInput {
  vectorBucketName: string;
  accountID: string;
}

export interface DeleteVectorBucketOutput {}

export async function deleteVectorBucket(
  this: TosVectorsClient,
  input: DeleteVectorBucketInput
) {
  const { vectorBucketName, accountID } = input;

  const query = {};

  const header = {};

  const body = {
    vectorBucketName: input.vectorBucketName,
  };

  const res = await this.fetchVectors<DeleteVectorBucketOutput>(
    'POST',
    '/DeleteVectorBucket',
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

export interface PutVectorBucketPolicyInput {
  vectorBucketName: string;
  accountID: string;
  policy: string;
}

export interface PutVectorBucketPolicyOutput {}

export async function putVectorBucketPolicy(
  this: TosVectorsClient,
  input: PutVectorBucketPolicyInput
) {
  const headers: Headers = {};

  const body = {
    vectorBucketName: input.vectorBucketName,
    policy: input.policy,
  };

  const res = await this.fetchVectors<PutVectorBucketPolicyOutput>(
    'POST',
    '/PutVectorBucketPolicy',
    {},
    headers,
    body,
    { bucket: input.vectorBucketName, accountId: input.accountID }
  );

  res.data = {};
  return res;
}

export interface GetVectorBucketPolicyInput {
  vectorBucketName: string;
  accountId: string;
}

export interface VectorBucketPolicyStatement {
  Sid: string;
  Effect: 'Allow' | 'Deny';
  Action?: string | string[];
  Principal?: string[];
  Resource?: string | string[];
}

export interface GetVectorBucketPolicyOutput {
  Statement: VectorBucketPolicyStatement[];
  Version: string;
}

export async function getVectorBucketPolicy(
  this: TosVectorsClient,
  input: GetVectorBucketPolicyInput
) {
  const { vectorBucketName, accountId } = input;

  const headers: Headers = {};

  const body = {
    vectorBucketName,
  };

  const res = await this.fetchVectors<GetVectorBucketPolicyOutput>(
    'POST',
    '/GetVectorBucketPolicy',
    {},
    headers,
    body,
    { accountId, bucket: vectorBucketName }
  );

  return res;
}

export interface DeleteVectorBucketPolicyInput {
  vectorBucketName: string;
  accountID: string;
}

export interface DeleteVectorBucketPolicyOutput {}

export async function deleteVectorBucketPolicy(
  this: TosVectorsClient,
  input: DeleteVectorBucketPolicyInput
) {
  const headers: Headers = {};

  const body = {
    vectorBucketName: input.vectorBucketName,
  };

  const res = await this.fetchVectors<DeleteVectorBucketPolicyOutput>(
    'POST',
    '/DeleteVectorBucketPolicy',
    {},
    headers,
    body,
    { bucket: input.vectorBucketName, accountId: input.accountID }
  );

  res.data = {};
  return res;
}
