import { handleEmptyServerError, makeArrayProp } from '../../utils';
import TOSBase, { TosResponse } from '../base';

export interface BucketPolicyStatement {
  Sid: string;
  Effect: 'Allow' | 'Deny';
  Action: string[];
  Condition?: {
    [key in string]: {
      [key in string]: string[];
    };
  };
  Principal: string[];
  Resource: string[];
}

export interface GetBucketPolicyOutput {
  Statement: BucketPolicyStatement[];
  Version: string;
}

interface PutBucketPolicyInputPolicy
  extends Omit<GetBucketPolicyOutput, 'Version'> {
  Version?: string;
}

export interface PutBucketPolicyInput {
  bucket?: string;
  policy: PutBucketPolicyInputPolicy;
}

export async function putBucketPolicy(
  this: TOSBase,
  input: PutBucketPolicyInput
) {
  if (!input.policy.Statement.length) {
    return deleteBucketPolicy.call(this, input.bucket);
  }

  const res = await this.fetchBucket(
    input.bucket,
    'PUT',
    { policy: '' },
    {},
    input.policy,
    { needMd5: true }
  );
  return res;
}

export async function getBucketPolicy(
  this: TOSBase,
  bucket?: string
): Promise<TosResponse<GetBucketPolicyOutput>> {
  try {
    const res = await this.fetchBucket<GetBucketPolicyOutput>(
      bucket,
      'GET',
      {
        policy: '',
      },
      {}
    );
    res.data.Statement.forEach((it: any) => {
      const arrayProp = makeArrayProp(it);

      arrayProp('Action');
      Object.keys(it.Condition || {}).forEach((key) => {
        Object.keys(it.Condition[key]).forEach((key2) => {
          arrayProp(`Condition["${key}"]["${key2}"]`);
        });
      });
      arrayProp('Principal');
      arrayProp('Resource');
    });
    return res;
  } catch (error) {
    return handleEmptyServerError<GetBucketPolicyOutput>(error, {
      Statement: [],
      Version: '2012-10-17',
    });
  }
}

export async function deleteBucketPolicy(this: TOSBase, bucket?: string) {
  return this.fetchBucket(bucket, 'DELETE', { policy: '' }, {});
}
