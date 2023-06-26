import {
  convertNormalCamelCase2Upper,
  handleEmptyServerError,
} from '../../utils';
import TOSBase from '../base';

const CommonQueryKey = 'website';

type Protocol = 'http' | 'https';

interface RedirectAllRequestsTo {
  HostName: string;
  Protocol?: Protocol;
}

interface IndexDocument {
  Suffix: string;
  ForbiddenSubDir?: boolean;
}
interface ErrorDocument {
  Key?: string;
}
interface RoutingRule {
  Condition: {
    HttpErrorCodeReturnedEquals?: number;
    KeyPrefixEquals?: string;
  };
  Redirect: {
    HostName?: string;
    HttpRedirectCode?: number;
    Protocol?: Protocol;
    ReplaceKeyPrefixWith?: string;
    ReplaceKeyWith?: string;
  };
}

export interface PutBucketWebsiteInput {
  bucket: string;
  redirectAllRequestsTo?: RedirectAllRequestsTo;
  indexDocument?: IndexDocument;
  errorDocument?: ErrorDocument;
  routingRules?: RoutingRule[];
}

export interface PutBucketWebsiteOutput {}

export async function putBucketWebsite(
  this: TOSBase,
  input: PutBucketWebsiteInput
) {
  const { bucket, ...otherProps } = input;

  const body = convertNormalCamelCase2Upper(otherProps);
  return this.fetchBucket<PutBucketWebsiteOutput>(
    bucket,
    'PUT',
    { [CommonQueryKey]: '' },
    {},
    {
      ...body,
    }
  );
}

export interface GetBucketWebsiteInput {
  bucket: string;
}

export interface GetBucketWebsiteOutput {
  RedirectAllRequestsTo?: RedirectAllRequestsTo;
  IndexDocument?: IndexDocument;
  ErrorDocument?: ErrorDocument;
  RoutingRules?: RoutingRule[];
}

export async function getBucketWebsite(
  this: TOSBase,
  input: GetBucketWebsiteInput
) {
  const { bucket } = input;

  try {
    return this.fetchBucket<GetBucketWebsiteOutput>(
      bucket,
      'GET',
      { [CommonQueryKey]: '' },
      {}
    );
  } catch (error) {
    return handleEmptyServerError<GetBucketWebsiteOutput>(error, {
      RoutingRules: [],
    });
  }
}

export interface DeleteBucketWebsiteInput {
  bucket: string;
}

export interface DeleteBucketWebsiteOutput {}

export async function deleteBucketWebsite(
  this: TOSBase,
  input: DeleteBucketWebsiteInput
) {
  const { bucket } = input;

  return this.fetchBucket<DeleteBucketWebsiteOutput>(
    bucket,
    'DELETE',
    { [CommonQueryKey]: '' },
    {}
  );
}
