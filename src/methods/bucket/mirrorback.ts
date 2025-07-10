import { handleEmptyServerError } from '../../handleEmptyServerError';
import TOSBase from '../base';

const CommonQueryKey = 'mirror';

export interface MirrorBackRule {
  ID: string;
  Condition: {
    HttpCode: number;
    KeyPrefix?: string;
    KeySuffix?: string;
    /** private unstable */
    AllowHost?: string[];
    /** private unstable */
    HttpMethod?: string[];
  };
  Redirect: {
    RedirectType?: 'Mirror' | 'Async';
    FetchSourceOnRedirect?: boolean;
    /** @private unstable */
    FetchSourceOnRedirectWithQuery?: boolean;
    PublicSource?: {
      SourceEndpoint: {
        Primary: string[];
        Follower?: string[];
      };
      FixedEndpoint?: boolean;
    };
    /** @private unstable */
    PrivateSource?: {
      SourceEndpoint: {
        Primary: {
          Endpoint: string;
          BucketName: string;
          CredentialProvider: { Role: string };
        }[];
      };
    };
    PassQuery?: boolean;
    FollowRedirect?: boolean;
    MirrorHeader?: {
      PassAll?: boolean;
      Pass?: string[];
      Remove?: string[];
      /** private unstable */
      Set?: { Key: string; Value: string }[];
    };
    /** @private unstable */
    PassHeaderFromSource?: string[];
    /** @private unstable */
    PassStatusCodeFromSource?: string[];

    /** @private unstable */
    DisableUploadSourceForNoneRangeMirror?: boolean;
    /** @private unstable */
    DisableUploadSourceForRangeMirror?: boolean;

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
  if (this.opts.enableOptimizeMethodBehavior && !rules.length) {
    return deleteBucketMirrorBack.call(this, { bucket });
  }

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
      enableCatchEmptyServerError: this.opts.enableOptimizeMethodBehavior,
      methodKey: 'getBucketMirrorBack',
      defaultResponse: {
        Rules: [],
      },
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
