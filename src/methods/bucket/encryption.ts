import TOSBase from '../base';
import { hashMd5 } from '../../universal/crypto.browser';

export interface EncryptionData {
  Rule: EncryptionDataRule;
}
export interface EncryptionDataRule {
  ApplyServerSideEncryptionByDefault: {
    SSEAlgorithm: string;
    KMSMasterKeyID: string;
  };
}
/**
 * @private unstable method
 */
export async function putBucketEncryption(
  this: TOSBase,
  input: { rule: EncryptionDataRule } & { bucket: string }
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

/**
 * @private unstable method
 */
export async function getBucketEncryption(
  this: TOSBase,
  input: { bucket: string }
) {
  const { bucket } = input;

  return this.fetchBucket<EncryptionData>(
    bucket,
    'GET',
    { encryption: '' },
    {}
  );
}

/**
 * @private unstable method
 */
export async function deleteBucketEncryption(
  this: TOSBase,
  input: { bucket: string }
) {
  const { bucket } = input;

  return this.fetchBucket(bucket, 'DELETE', { encryption: '' }, {});
}
