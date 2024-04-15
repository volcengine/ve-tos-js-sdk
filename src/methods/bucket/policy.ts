import { makeArrayProp } from '../../utils';
import { handleEmptyServerError } from '../../handleEmptyServerError';
import TOSBase, { TosResponse } from '../base';

export interface BucketPolicyStatement {
  Sid: string;
  Effect: 'Allow' | 'Deny';
  Action?: string | string[];
  NotAction?: string | string[];
  Condition?: {
    [key in string]: {
      [key in string]: string[];
    };
  };
  Principal?: string[];
  NotPrincipal?: string[];
  Resource?: string | string[];
  NotResource?: string | string[];
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
  if (
    (this.opts.enableOptimizeMethodBehavior ||
      this.opts.enableOptimizeMethodBehavior === undefined) &&
    !input.policy.Statement.length
  ) {
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

      Object.keys(it.Condition || {}).forEach((key) => {
        Object.keys(it.Condition[key]).forEach((key2) => {
          arrayProp(`Condition["${key}"]["${key2}"]`);
        });
      });
    });
    return res;
  } catch (error) {
    return handleEmptyServerError<GetBucketPolicyOutput>(error, {
      enableCatchEmptyServerError: this.opts.enableOptimizeMethodBehavior,
      methodKey: 'getBucketPolicy',
      defaultResponse: {
        Statement: [],
        Version: '2012-10-17',
      },
    });
  }
}

export async function deleteBucketPolicy(this: TOSBase, bucket?: string) {
  return this.fetchBucket(bucket, 'DELETE', { policy: '' }, {});
}
