import { TOSConstructorOptions } from '../../src/methods/base';

require('dotenv').config();

if (!process.env.ACCESS_KEY_ID || !process.env.ACCESS_KEY_SECRET) {
  throw Error(
    'Need environment variables: ACCESS_KEY_ID and ACCESS_KEY_SECRET, but not found.'
  );
}

const targetEnv = process.env.TARGET_ENVIRONMENT || 'node';
export const testBucketNameBase = `ve-tos-js-sdk-${targetEnv}-test`;
export const testBucketName = `${testBucketNameBase}-bucket`;
export const testCRRTargetBucketName = `${testBucketNameBase}-crr-target-bucket`;
// The rename configuration conflicts with multi-version configuration
// 需要一个重未开过多版本的 bucket 来测试
export const testBucketRenameBucketName = `${testBucketNameBase}-bucket-rename`;
export const testPreSignedPolicyBucketName = `${testBucketNameBase}-presignedpolicyurl`;
export const testCRRTargetRegion = process.env.CRR_TARGET_REGION || '';
export const testCRRTargetEndpoint = process.env.CRR_TARGET_ENDPOINT || '';
export const testCloudFunctionId =
  process.env.TOS_NODE_SDK_CLOUD_FUNCTION_ID ?? '';
export const testCallBackUrl = process.env.TOS_NODE_SDK_CALLBACK_URL ?? '';

export const testAccountId = process.env.TOS_NODE_SDK_ACCOUNT_ID ?? '';

// because one account has at most 100 buckets,
// we delete some bucket when there can't create more buckets.
const deleteBucketNames = [testBucketName, 'other-bucket-will-be-deleted'];
export const isNeedDeleteBucket = (bucket: string) => {
  return (
    deleteBucketNames.includes(bucket) || bucket.includes(testBucketNameBase)
  );
};

const region = process.env.REGION || '';
const bucket = testBucketName;
const endpoint = process.env.ENDPOINT || '';
export const tosOptions: TOSConstructorOptions & { bucket: string } = {
  accessKeyId: process.env.ACCESS_KEY_ID || '',
  accessKeySecret: process.env.ACCESS_KEY_SECRET || '',
  stsToken: process.env.SESSION_TOKEN || '',
  region,
  bucket,
  endpoint,
  // proxyHost: '127.0.0.1',
  // proxyPort: 8888,
};
export const tosCRRTargetOptions = {
  ...tosOptions,
  region: testCRRTargetRegion,
  endpoint: testCRRTargetEndpoint,
};

export const specialCharKey = `（!-_.*()/&$@=;:+ ,?\{^}%\`]>[~<#|'"）! ~ * ' ( )%2`;
