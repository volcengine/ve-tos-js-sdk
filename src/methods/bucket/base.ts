import TOSBase from '../base';
import { Acl, Headers, StorageClass } from '../../interface';
import {
  fillRequestHeaders,
  makeArrayProp,
  normalizeHeadersKey,
} from '../../utils';
import TosClientError from '../../TosClientError';
import { AzRedundancyType, StorageClassType } from '../../TosExportEnum';
import { TosHeader } from '../object/sharedTypes';

export interface Bucket {
  // '2021-07-20T09:22:05.000Z'
  CreationDate: string;
  ExtranetEndpoint: string;
  IntranetEndpoint: string;
  Location: string;
  Name: string;
  Owner: { ID: string };
  BucketType?: string;
}

export interface ListBucketOutput {
  Buckets: Bucket[];
}

export interface PutBucketInput {
  bucket?: string;
  acl?: Acl;
  grantFullControl?: string;
  grantRead?: string;
  grantReadAcp?: string;
  grantWrite?: string;
  grantWriteAcp?: string;
  storageClass?: StorageClassType;
  azRedundancy?: AzRedundancyType;
  projectName?: string;
  bucketType?: string;
  headers?: {
    [key: string]: string | undefined;
    ['x-tos-acl']?: Acl;
    ['x-tos-grant-full-control']?: string;
    ['x-tos-grant-read']?: string;
    ['x-tos-grant-read-acp']?: string;
    ['x-tos-grant-write']?: string;
    ['x-tos-grant-write-acp']?: string;
    ['x-tos-storage-class']?: StorageClass;
  };
}
export interface ListBucketInput {
  projectName?: string;
}
export async function listBuckets(this: TOSBase, input: ListBucketInput = {}) {
  const headers = {};
  /**
   * empty string is invalid value
   */
  input?.projectName &&
    fillRequestHeaders({ ...input, headers }, ['projectName']);
  const res = await this.fetch<ListBucketOutput>('GET', '/', {}, headers);
  const arrayProp = makeArrayProp(res.data);
  arrayProp('Buckets');

  return res;
}

export async function createBucket(this: TOSBase, input: PutBucketInput) {
  const actualBucket = input.bucket || this.opts.bucket;
  // these errors are only for creating bucket
  if (actualBucket) {
    if (actualBucket.length < 3 || actualBucket.length > 63) {
      throw new TosClientError(
        'invalid bucket name, the length must be [3, 63]'
      );
    }
    if (!/^([a-z]|-|\d)+$/.test(actualBucket)) {
      throw new TosClientError(
        'invalid bucket name, the character set is illegal'
      );
    }
    if (/^-/.test(actualBucket) || /-$/.test(actualBucket)) {
      throw new TosClientError(
        `invalid bucket name, the bucket name can be neither starting with '-' nor ending with '-'`
      );
    }
  }
  const headers = (input.headers = normalizeHeadersKey(input.headers));

  fillRequestHeaders(input, [
    'acl',
    'grantFullControl',
    'grantRead',
    'grantReadAcp',
    'grantWrite',
    'grantWriteAcp',
    'storageClass',
    'azRedundancy',
    'bucketType',
  ]);

  /**
   * empty string is invalid value
   */
  input?.projectName && fillRequestHeaders(input, ['projectName']);

  const res = await this.fetchBucket(input.bucket, 'PUT', {}, headers);
  return res;
}

export async function deleteBucket(this: TOSBase, bucket?: string) {
  return this.fetchBucket(bucket, 'DELETE', {}, {});
}

export interface HeadBucketOutput {
  ['x-tos-bucket-region']: string;
  ['x-tos-storage-class']: StorageClass;
  ['x-tos-bucket-type']?: string;
  ProjectName?: string;
}

export async function headBucket(this: TOSBase, bucket?: string) {
  return this.fetchBucket<HeadBucketOutput>(bucket, 'HEAD', {}, {}, undefined, {
    handleResponse: (res) => {
      return {
        ...res.headers,
        ProjectName: res.headers[TosHeader.HeaderProjectName],
      };
    },
  });
}

export interface PutBucketStorageClassInput {
  bucket: string;
  storageClass: StorageClassType;
}

export interface PutBucketStorageClassOutput {}

export async function putBucketStorageClass(
  this: TOSBase,
  input: PutBucketStorageClassInput
) {
  const { bucket, storageClass } = input;

  return this.fetchBucket<PutBucketStorageClassOutput>(
    bucket,
    'PUT',
    { storageClass: '' },
    {
      'x-tos-storage-class': storageClass,
    }
  );
}
