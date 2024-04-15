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
export const testCRRSourceBucketName = `${testBucketNameBase}-crr-source-bucket`;
export const testCRRTargetBucketName = `${testBucketNameBase}-crr-target-bucket`;
// need a bucket that doesn't enable multi-version feature, otherwise maybe throw an error:
// The rename configuration conflicts with multi-version configuration.
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
export const tosCRRSourceOptions = {
  ...tosOptions,
  region,
  endpoint,
};
export const tosCRRTargetOptions = {
  ...tosOptions,
  region: testCRRTargetRegion,
  endpoint: testCRRTargetEndpoint,
};

export const specialCharKey = `（!-_.*()/&$@=;:+ ,?\{^}%\`]>[~<#|'"）! ~ * ' ( )%2`;

export const testProjectName = `ve-tos-js-sdk-${targetEnv}-test-project`;
export const testBucketNameWithProjectName = `ve-tos-js-sdk-${targetEnv}-test-bucket-name`;
