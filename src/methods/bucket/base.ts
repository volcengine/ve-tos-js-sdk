import TOSBase from '../base';
import { Headers, Acl, StorageClass } from '../../interface';
import { makeArrayProp } from '../../utils';

export interface Bucket {
  // '2021-07-20T09:22:05.000Z'
  CreationDate: string;
  ExtranetEndpoint: string;
  IntranetEndpoint: string;
  Location: string;
  Name: string;
  Owner: { ID: string };
}

export interface ListBucketOutput {
  Buckets: Bucket[];
}

export interface PutBucketInput {
  bucket?: string;
  acl?: Acl;
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

export async function listBuckets(this: TOSBase) {
  const res = await this.fetch<ListBucketOutput>('GET', '/', {}, {});
  const arrayProp = makeArrayProp(res.data);
  arrayProp('Buckets');

  return res;
}

export async function createBucket(this: TOSBase, input: PutBucketInput) {
  const headers: Headers = input.headers || {};

  if (input.acl) {
    if (!headers['x-tos-acl']) {
      headers['x-tos-acl'] = input.acl;
    }
  }

  const res = await this.fetchBucket(input.bucket, 'PUT', {}, headers);
  return res;
}

export async function deleteBucket(this: TOSBase, bucket?: string) {
  return this.fetchBucket(bucket, 'DELETE', {}, {});
}

export interface HeadBucketOutput {
  ['x-tos-bucket-region']: string;
  ['x-tos-storage-class']: StorageClass;
}

export async function headBucket(this: TOSBase, bucket?: string) {
  return this.fetchBucket<HeadBucketOutput>(bucket, 'HEAD', {}, {}, undefined, {
    handleResponse: res => {
      return res.headers;
    },
  });
}
