import TOSBase from '../base';

export enum BucketVersioningStatus {
  Enable = 'Enabled',
  Suspended = 'Suspended',
  Disable = '',
}

export type PutBucketVersioningInputStatus =
  | BucketVersioningStatus.Enable
  | BucketVersioningStatus.Suspended;

export interface GetBucketVersioningOutput {
  Status: BucketVersioningStatus;
}

export interface PutBucketVersioningInput {
  bucket?: string;
  status: PutBucketVersioningInputStatus;
}

export async function getBucketVersioning(this: TOSBase, bucket?: string) {
  return this.fetchBucket<GetBucketVersioningOutput>(
    bucket,
    'GET',
    { versioning: '' },
    {}
  );
}

export async function putBucketVersioning(
  this: TOSBase,
  input: PutBucketVersioningInput
) {
  return this.fetchBucket(
    input.bucket,
    'PUT',
    { versioning: '' },
    {},
    {
      Status: input.status,
    }
  );
}
