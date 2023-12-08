import { VersioningStatusType } from '../../TosExportEnum';
import TOSBase from '../base';

// for backward compatibility
export { VersioningStatusType as BucketVersioningStatus };

export type PutBucketVersioningInputStatus =
  | VersioningStatusType.Enable
  | VersioningStatusType.Enabled
  | VersioningStatusType.Suspended;

export interface GetBucketVersioningOutput {
  Status: VersioningStatusType;
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
