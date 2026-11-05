import fs from 'fs';
import os from 'os';
import path from 'path';
import { Readable } from 'stream';

import { getObjectToFile } from '../../src/methods/object/getObject';

describe('getObjectToFile', () => {
  const originalEnvironment = process.env.TARGET_ENVIRONMENT;

  beforeAll(() => {
    process.env.TARGET_ENVIRONMENT = 'node';
  });

  afterAll(() => {
    if (originalEnvironment === undefined) {
      delete process.env.TARGET_ENVIRONMENT;
    } else {
      process.env.TARGET_ENVIRONMENT = originalEnvironment;
    }
  });

  it('rejects when fetching the object fails instead of leaving the caller pending', async () => {
    const failure = new Error('network down');
    const client = {
      _fetchObject: () => Promise.reject(failure),
    } as any;

    await expect(
      getObjectToFile.call(client, { key: 'missing', filePath: 'unused' })
    ).rejects.toBe(failure);
  });

  it('still resolves with the response once the file has been written', async () => {
    const filePath = path.join(
      fs.mkdtempSync(path.join(os.tmpdir(), 'tos-get-object-to-file-')),
      'object.bin'
    );
    const client = {
      _fetchObject: () =>
        Promise.resolve({
          headers: {},
          data: Readable.from(['payload']),
        }),
    } as any;

    try {
      const result = await getObjectToFile.call(client, { key: 'k', filePath });
      expect(fs.readFileSync(filePath, 'utf8')).toBe('payload');
      expect((result.data as any).content).toBeUndefined();
    } finally {
      fs.rmSync(path.dirname(filePath), { recursive: true, force: true });
    }
  });
});
