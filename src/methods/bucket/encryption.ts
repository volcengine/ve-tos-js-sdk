import TOSBase from '../base';
import { hashMd5 } from '../../universal/crypto.browser';

export interface EncryptionData {
  Rule: EncryptionDataRule;
}
export interface EncryptionDataRule {
  ApplyServerSideEncryptionByDefault: {
    // SSEAlgorithm support 'kms' and 'AES256' and 'sm4'
    SSEAlgorithm: string;
    KMSMasterKeyID?: string;
    /** @private unstable */
    KMSDataEncryption?: string;
  };
}

export async function putBucketEncryption(
  this: TOSBase,
  input: { rule: EncryptionDataRule } & { bucket?: string }
) {
  const { bucket, rule } = input;

  return this.fetchBucket(
    bucket,
    'PUT',
    { encryption: '' },
    {
      'Content-MD5': hashMd5(
        JSON.stringify({
          Rule: rule,
        }),
        'base64'
      ),
    },
    {
      Rule: rule,
    }
  );
}

export async function getBucketEncryption(
  this: TOSBase,
  input: { bucket?: string }
) {
  const { bucket } = input;

  return this.fetchBucket<EncryptionData>(
    bucket,
    'GET',
    { encryption: '' },
    {}
  );
}

export async function deleteBucketEncryption(
  this: TOSBase,
  input: { bucket?: string }
) {
  const { bucket } = input;

  return this.fetchBucket(bucket, 'DELETE', { encryption: '' }, {});
}
