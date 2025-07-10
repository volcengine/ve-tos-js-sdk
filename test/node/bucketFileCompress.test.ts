import { TosClient } from '../../src/browser-index';
import TOSBase, { TosResponse } from '../../src/methods/base';
import {
  CreateFileCompressInput,
  CreateFileCompressOutput,
} from '../../src/methods/fileCompress';
import { NEVER_TIMEOUT } from '../utils';
import { tosOptions } from '../utils/options';

describe('createFileCompress', () => {
  it(
    'encryption putBucketEncryption',
    async () => {
      const client = new TosClient({
        ...tosOptions,
      });

      const res = await client.createFileCompress({
        bucket: 'test-bucket',
        Input: {
          Prefix: 'source/',
          KeyConfig: [{ Key: 'file1.txt' }],
        },
        FileCompressConfig: {
          Format: 'zip',
          Flatten: 0,
        },
        Output: {
          Region: 'cn-beijing',
          Bucket: 'output-bucket',
          Object: 'result.zip',
        },
      });

      expect(res.data.Code).toEqual('Success');
    },
    NEVER_TIMEOUT
  );
});
