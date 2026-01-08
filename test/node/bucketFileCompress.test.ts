import { TosClient } from '../../src/browser-index';
import TOSBase, { TosResponse } from '../../src/methods/base';
import {
  CreateFileCompressInput,
  CreateFileCompressOutput,
} from '../../src/methods/fileCompress';
import { NEVER_TIMEOUT } from '../utils';
import { testBucketName, testFileCompressBucketName, tosOptions } from '../utils/options';
describe('createFileCompress', () => {
  it(
    'encryption putBucketEncryption',
    async () => {
      const client = new TosClient({
        ...tosOptions,
      });

      const res = await client.createFileCompress({
        bucket: testFileCompressBucketName,
        Input: {
          KeyConfig: [{ Key: 'source/test.mov' }],
        },
        FileCompressConfig: {
          Format: 'zip',
          Flatten: 0,
        },
        Output: {
          Region: 'cn-guilin-boe',
          Bucket: testFileCompressBucketName,
          Object: 'result.zip',
        },
      });

      expect(res.data.Code).toEqual('OK');
    },
    NEVER_TIMEOUT
  );
});
