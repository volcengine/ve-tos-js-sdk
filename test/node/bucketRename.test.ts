import TOS from '../../src/browser-index';
import { NEVER_TIMEOUT } from '../utils';
import {
  tosOptions as commonTosOptions,
  testBucketRenameBucketName,
} from '../utils/options';
const CommonTestCasePrefix = 'Rename';

// The rename configuration conflicts with multi-version configuration
// 需要一个重未开过多版本的 bucket 来测试
const tosOptions = {
  ...commonTosOptions,
  bucket: testBucketRenameBucketName,
};

describe(`bucket ${CommonTestCasePrefix} methods`, () => {
  it(
    `${CommonTestCasePrefix} getBucketRename empty case`,
    async () => {
      const client = new TOS({
        ...tosOptions,
      });

      const result = await client.getBucketRename({});

      expect(result.data.RenameEnable).toBe(false);
    },
    NEVER_TIMEOUT
  );
  it(
    `${CommonTestCasePrefix} putBucketRename`,
    async () => {
      const client = new TOS({
        ...tosOptions,
      });

      const result = await client.putBucketRename({
        renameEnable: true,
      });

      expect(result.data).toBe('');
    },
    NEVER_TIMEOUT
  );

  it(
    `${CommonTestCasePrefix} getBucketRename`,
    async () => {
      const client = new TOS({
        ...tosOptions,
      });

      const result = await client.getBucketRename({});

      expect(result.data.RenameEnable).toBeTruthy();
    },
    NEVER_TIMEOUT
  );

  it(
    `${CommonTestCasePrefix} deleteBucketRename`,
    async () => {
      const client = new TOS({
        ...tosOptions,
      });

      const result = await client.deleteBucketRename({});

      expect(result.data).toBe('');

      const getResult = await client.getBucketRename({});

      expect(getResult.data.RenameEnable).toBe(false);
    },
    NEVER_TIMEOUT
  );
});
