import { convertNormalCamelCase2Upper } from '../../utils';
import { handleEmptyServerError } from '../../handleEmptyServerError';
import TOSBase from '../base';

const CommonQueryKey = 'customdomain';

export interface CustomDomainRule {
  Domain: string;
  Cname: string;
  Forbidden?: boolean;
  ForbiddenReason?: string;
  CertId?: string;
  CertStatus?: string;
  /**@private unstable
   * value tos|s3
   * */
  Protocol?: string;
}

export interface PutBucketCustomDomainInput {
  bucket: string;
  customDomainRule: {
    Domain: string;
    CertId?: string;
    /**@private unstable
     * value tos|s3
     * */
    Protocol?: string;
  };
}

export interface PutBucketCustomDomainOutput {}

export async function putBucketCustomDomain(
  this: TOSBase,
  input: PutBucketCustomDomainInput
) {
  const { bucket, ...otherProps } = input;

  const body = convertNormalCamelCase2Upper(otherProps);
  return this.fetchBucket<PutBucketCustomDomainOutput>(
    bucket,
    'PUT',
    { [CommonQueryKey]: '' },
    {},
    {
      ...body,
    }
  );
}

export interface GetBucketCustomDomainInput {
  bucket: string;
}

export interface GetBucketCustomDomainOutput {
  CustomDomainRules: CustomDomainRule[];
}

export async function getBucketCustomDomain(
  this: TOSBase,
  input: GetBucketCustomDomainInput
) {
  try {
    const { bucket } = input;
    return await this.fetchBucket<GetBucketCustomDomainOutput>(
      bucket,
      'GET',
      { [CommonQueryKey]: '' },
      {}
    );
  } catch (error) {
    return handleEmptyServerError<GetBucketCustomDomainOutput>(error, {
      defaultResponse: { CustomDomainRules: [] },
      enableCatchEmptyServerError: this.opts.enableOptimizeMethodBehavior,
      methodKey: 'getBucketCustomDomain',
    });
  }
}

export interface DeleteBucketCustomDomainInput {
  bucket: string;
  customDomain: string;
}

export interface DeleteBucketCustomDomainOutput {}

export async function deleteBucketCustomDomain(
  this: TOSBase,
  input: DeleteBucketCustomDomainInput
) {
  const { bucket, customDomain } = input;

  return this.fetchBucket<DeleteBucketCustomDomainOutput>(
    bucket,
    'DELETE',
    { customdomain: customDomain },
    {}
  );
}
