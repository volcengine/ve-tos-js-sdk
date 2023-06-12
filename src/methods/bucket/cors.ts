import { HttpMethodType } from '../../TosExportEnum';
import TOSBase from '../base';

interface CORSRule {
  AllowedOrigins: string[];
  AllowedMethods: HttpMethodType[];
  AllowedHeaders: string[];
  ExposeHeaders: string[];
  MaxAgeSeconds: number;
}

export interface GetBucketCORSInput {
  bucket: string;
}

export interface GetBucketCORSOutput {
  CORSRules: CORSRule[];
}

export async function getBucketCORS(this: TOSBase, input: GetBucketCORSInput) {
  const { bucket } = input;

  return this.fetchBucket<GetBucketCORSOutput>(bucket, 'GET', { cors: '' }, {});
}

export interface PutBucketCORSInput {
  bucket: string;
  CORSRules: CORSRule[];
}

export interface PutBucketCORSOutput {}

export async function putBucketCORS(this: TOSBase, input: PutBucketCORSInput) {
  const { bucket, CORSRules } = input;

  return this.fetchBucket<PutBucketCORSOutput>(
    bucket,
    'PUT',
    { cors: '' },
    {},
    { CORSRules }
  );
}

export interface DeleteBucketCORSInput {
  bucket: string;
}

export interface DeleteBucketCORSOutput {}

export async function deleteBucketCORS(
  this: TOSBase,
  input: DeleteBucketCORSInput
) {
  const { bucket } = input;

  return this.fetchBucket<DeleteBucketCORSOutput>(
    bucket,
    'DELETE',
    { cors: '' },
    {}
  );
}
