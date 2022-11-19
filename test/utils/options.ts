import { TOSConstructorOptions } from '../../src/methods/base';

require('dotenv').config();

if (!process.env.ACCESS_KEY_ID || !process.env.ACCESS_KEY_SECRET) {
  throw Error(
    'Need environment variables: ACCESS_KEY_ID and ACCESS_KEY_SECRET, but not found.'
  );
}

export const testBucketNameBase = 'test-cg-bucket-name';
export const testBucketName = `${testBucketNameBase}-${new Date().valueOf()}`;

// because one account has at most 100 buckets,
// we delete some bucket when there can't create more buckets.
const deleteBucketNames = [testBucketName, 'aaaa'];
export const isNeedDeleteBucket = (bucket: string) => {
  return (
    deleteBucketNames.includes(bucket) || bucket.includes(testBucketNameBase)
  );
};

const region = process.env.REGION || 'cn-beijing';
const bucket = testBucketName;
const endpoint = process.env.ENDPOINT || '';
export const tosOptions: TOSConstructorOptions & { bucket: string } = {
  accessKeyId: process.env.ACCESS_KEY_ID || '',
  accessKeySecret: process.env.ACCESS_KEY_SECRET || '',
  stsToken: process.env.SESSION_TOKEN || '',
  region,
  bucket,
  endpoint,
};
