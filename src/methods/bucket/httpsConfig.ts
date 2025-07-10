import TOSBase from '../base';

interface TLSHttpsConfig {
  Enable: boolean;
  MinTLSVersion: string;
  MaxTLSVersion: string;
}

export interface PutBucketHttpsConfigInput  {
  bucket: string;
  TLS: TLSHttpsConfig;
}

export interface GetBucketHttpsConfigOutput  {
  TLS: TLSHttpsConfig;
}

/**
 * @private
 */
export async function putBucketHttpsConfig(this: TOSBase, input: PutBucketHttpsConfigInput) {
  const { bucket, TLS } = input;
  const res = await this.fetchBucket(
    bucket,
    'PUT',
    { httpsConfig: '' },
    {},
    {
      TLS,
    },
  );
  return res;
}

/**
 * @private
 */
export async function getBucketHttpsConfig(this: TOSBase, bucket: string) {
  const res = await this.fetchBucket<GetBucketHttpsConfigOutput>(
    bucket,
    'GET',
    {
      httpsConfig: '',
    },
    {}
  );
  return res;
}
