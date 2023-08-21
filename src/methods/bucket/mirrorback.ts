import { handleEmptyServerError } from '../../utils';
import TOSBase from '../base';

const CommonQueryKey = 'mirror';

interface MirrorBackRule {
  ID: string;
  Condition: {
    HttpCode: number;
    KeyPrefix?: string;
    KeySuffix?: string;
  };
  Redirect: {
    RedirectType?: 'Mirror' | 'Async';
    FetchSourceOnRedirect?: boolean;
    PublicSource: {
      SourceEndpoint: {
        Primary: string[];
        FixedEndpoint?: boolean;
      };
    };
    PassQuery?: boolean;
    FollowRedirect?: boolean;
    MirrorHeader?: {
      PassAll?: boolean;
      Pass?: string[];
      Remove?: string[];
    };
    Transform?: {
      WithKeyPrefix?: string;
      WithKeySuffix?: string;
      ReplaceKeyPrefix?: {
        KeyPrefix?: string;
        ReplaceWith?: string;
      };
    };
  };
}

export interface PutBucketMirrorBackInput {
  bucket: string;
  rules: MirrorBackRule[];
}

export interface PutBucketMirrorBackOutput {}

export async function putBucketMirrorBack(
  this: TOSBase,
  input: PutBucketMirrorBackInput
) {
  const { bucket, rules } = input;

  return this.fetchBucket<PutBucketMirrorBackOutput>(
    bucket,
    'PUT',
    { [CommonQueryKey]: '' },
    {},
    {
      Rules: rules,
    }
  );
}

export interface GetBucketMirrorBackInput {
  bucket: string;
}

export interface GetBucketMirrorBackOutput {
  Rules: MirrorBackRule[];
}

export async function getBucketMirrorBack(
  this: TOSBase,
  input: GetBucketMirrorBackInput
) {
  const { bucket } = input;

  try {
    return await this.fetchBucket<GetBucketMirrorBackOutput>(
      bucket,
      'GET',
      { [CommonQueryKey]: '' },
      {}
    );
  } catch (error) {
    return handleEmptyServerError<GetBucketMirrorBackOutput>(error, {
      Rules: [],
    });
  }
}

export interface DeleteBucketMirrorBackInput {
  bucket: string;
}

export interface DeleteBucketMirrorBackOutput {}

export async function deleteBucketMirrorBack(
  this: TOSBase,
  input: DeleteBucketMirrorBackInput
) {
  const { bucket } = input;

  return this.fetchBucket<DeleteBucketMirrorBackOutput>(
    bucket,
    'DELETE',
    { [CommonQueryKey]: '' },
    {}
  );
}
