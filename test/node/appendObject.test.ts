import fs from 'fs';
import fsp from 'fs/promises';

import TOS, { StorageClassType } from '../../src/browser-index';
import { DataTransferType } from '../../src/interface';
import { NEVER_TIMEOUT } from '../utils';
import { tosOptions } from '../utils/options';
import { objectPath10M, objectPath1K } from './utils';

describe('appendObject in node.js environment', () => {
  it(
    'appendObjectForSpecialKey',
    async () => {
      const client = new TOS(tosOptions);
      const keys = [
        'append-a',
        'append-中文',
        'append-많이드세요. 오늘내가쓸게요',
        `append-!-_.*()/&$@=;:+ ,?\{^}%\`]>[~<#|'"）`,
      ];

      for (const key of keys) {
        const appendResult = await client.appendObject({
          key,
          offset: 0,
          body: await fsp.readFile(objectPath1K),
          storageClass: StorageClassType.StorageClassStandard,
        });
        await client.appendObject({
          key,
          offset: appendResult.data.nextAppendOffset,
          body: fs.createReadStream(objectPath1K),
          contentLength: 1024,
          storageClass: StorageClassType.StorageClassStandard,
        });
        const { headers } = await client.headObject(key);
        expect(+headers['content-length']!).toEqual(2 * 1024);
      }
    },
    NEVER_TIMEOUT
  );
});
