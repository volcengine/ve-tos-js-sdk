import { HttpMethodType } from '../../TosExportEnum';
import { handleEmptyServerError } from '../../handleEmptyServerError';
import TOSBase from '../base';

export interface CORSRule {
  AllowedOrigins: string[];
  AllowedMethods: HttpMethodType[];
  AllowedHeaders: string[];
  ExposeHeaders: string[];
  MaxAgeSeconds: number;
  ResponseVary?: boolean;
}

export interface GetBucketCORSInput {
  bucket: string;
}

export interface GetBucketCORSOutput {
  CORSRules: CORSRule[];
}

export async function getBucketCORS(this: TOSBase, input: GetBucketCORSInput) {
  try {
    const { bucket } = input;

    return await this.fetchBucket<GetBucketCORSOutput>(
      bucket,
      'GET',
      { cors: '' },
      {}
    );
  } catch (error) {
    return handleEmptyServerError<GetBucketCORSOutput>(error, {
      defaultResponse: { CORSRules: [] },
      enableCatchEmptyServerError: this.opts.enableOptimizeMethodBehavior,
      methodKey: 'getBucketCORS',
    });
  }
}

export interface PutBucketCORSInput {
  bucket: string;
  CORSRules: CORSRule[];
}

export interface PutBucketCORSOutput {}

export async function putBucketCORS(this: TOSBase, input: PutBucketCORSInput) {
  const { bucket, CORSRules } = input;
  if (this.opts.enableOptimizeMethodBehavior && !CORSRules.length) {
    return deleteBucketCORS.call(this, { bucket });
  }
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
