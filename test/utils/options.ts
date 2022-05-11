import { TOSConstructorOptions } from '../../src/methods/base';

require('dotenv').config();

if (!process.env.ACCESS_KEY_ID || !process.env.ACCESS_KEY_SECRET) {
  throw Error(
    'Need environment variables: ACCESS_KEY_ID and ACCESS_KEY_SECRET, but not found.'
  );
}

export const testBucketName = 'test-cg-bucket-name';
// because one account has at most 100 buckets,
// we delete some bucket when there can't create more buckets.
export const deleteBucketNames = [testBucketName, 'aaaa'];

export const tosOptions: TOSConstructorOptions = {
  accessKeyId: process.env.ACCESS_KEY_ID || '',
  accessKeySecret: process.env.ACCESS_KEY_SECRET || '',
  region: 'cn-beijing',
  bucket: testBucketName,
};
