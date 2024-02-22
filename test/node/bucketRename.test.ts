import TOS from '../../src/browser-index';
import { NEVER_TIMEOUT } from '../utils';
import {
  tosOptions as commonTosOptions,
  testBucketRenameBucketName,
} from '../utils/options';
const CommonTestCasePrefix = 'Rename';

const tosOptions = {
  ...commonTosOptions,
  bucket: testBucketRenameBucketName,
};

describe(`bucket ${CommonTestCasePrefix} methods`, () => {
  beforeAll(async (done) => {
    const client = new TOS({
      ...tosOptions,
    });
    await client.deleteBucketRename({});

    done();
  }, NEVER_TIMEOUT);

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
