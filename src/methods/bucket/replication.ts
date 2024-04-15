import {
  ACLType,
  StorageClassInheritDirectiveType,
  StorageClassType,
} from '../../TosExportEnum';
import { handleEmptyServerError } from '../../handleEmptyServerError';
import TOSBase from '../base';

const CommonQueryKey = 'replication';

export interface ReplicationTag {
  Key: string;
  Value: string;
}

export interface ReplicationRule {
  ID: string;
  Status: string;
  PrefixSet?: string[];
  Destination: {
    Bucket: string;
    Location: string;
    StorageClass?: StorageClassType;
    StorageClassInheritDirective: StorageClassInheritDirectiveType;
  };
  HistoricalObjectReplication: 'Enabled' | 'Disabled';
  /** @private unstable */
  Tags?: ReplicationTag[];
  AccessControlTranslation?: {
    Owner: string; //"BucketOwnerEntrusted"
  };
}

export interface PutBucketReplicationInput {
  bucket: string;
  role: string;
  rules: ReplicationRule[];
}

export interface PutBucketReplicationOutput {}

export async function putBucketReplication(
  this: TOSBase,
  input: PutBucketReplicationInput
) {
  const { bucket, rules, role } = input;
  if (this.opts.enableOptimizeMethodBehavior && !rules.length) {
    return deleteBucketReplication.call(this, { bucket });
  }

  return this.fetchBucket<PutBucketReplicationOutput>(
    bucket,
    'PUT',
    { [CommonQueryKey]: '' },
    {},
    {
      Role: role,
      Rules: rules,
    }
  );
}

export interface GetBucketReplicationInput {
  bucket: string;
  progress?: string;
  ruleId?: string;
}

export interface GetBucketReplicationOutput {
  Role: string;
  Rules: ReplicationRule[];
}

export async function getBucketReplication(
  this: TOSBase,
  input: GetBucketReplicationInput
) {
  const { bucket, progress, ruleId } = input;
  const query: Record<string, string> = {
    [CommonQueryKey]: '',
    progress: progress || '',
  };
  if (ruleId != null) {
    query['rule-id'] = `${ruleId}`;
  }

  try {
    return await this.fetchBucket<GetBucketReplicationOutput>(
      bucket,
      'GET',
      query,
      {}
    );
  } catch (err) {
    return handleEmptyServerError<GetBucketReplicationOutput>(err, {
      enableCatchEmptyServerError: this.opts.enableOptimizeMethodBehavior,
      methodKey: 'getBucketReplication',
      defaultResponse: {
        Rules: [],
        Role: '',
      },
    });
  }
}

export interface DeleteBucketReplicationInput {
  bucket: string;
}

export interface DeleteBucketReplicationOutput {}

export async function deleteBucketReplication(
  this: TOSBase,
  input: DeleteBucketReplicationInput
) {
  const { bucket } = input;

  return this.fetchBucket<DeleteBucketReplicationOutput>(
    bucket,
    'DELETE',
    { [CommonQueryKey]: '' },
    {}
  );
}
