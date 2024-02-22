import TOS from '../../src/browser-index';
import { DataTransferType } from '../../src/interface';
import { NEVER_TIMEOUT } from '../utils';
import { tosOptions } from '../utils/options';
import { objectPath10M, objectPath1K } from './utils';

describe('putObject data transfer in node.js environment', () => {
  it(
    'putObjectForSpecialKey',
    async () => {
      const client = new TOS(tosOptions);
      const keys = [
        'a',
        '中文',
        '많이드세요. 오늘내가쓸게요',
        `!-_.*()/&$@=;:+ ,?\{^}%\`]>[~<#|'"）`,
      ];

      for (const key of keys) {
        await client.putObjectFromFile({ key, filePath: objectPath1K });
        const { headers } = await client.headObject(key);
        expect(+headers['content-length']!).toEqual(1 * 1024);
      }
    },
    NEVER_TIMEOUT
  );

  it(
    'put buffer',
    async () => {
      const size = 10 * 1024 * 1024;
      const buffer = Buffer.alloc(size, 'a');
      const client = new TOS(tosOptions);
      const progressFn = jest.fn();
      const dataTransferFn = jest.fn();
      await client.putObject({
        key: 'putObject-put-buffer-10M',
        body: buffer,
        dataTransferStatusChange: dataTransferFn,
        progress: progressFn,
      });
      expect(progressFn.mock.calls[0][0]).toEqual(0);
      expect(progressFn.mock.calls.filter((it) => it[0] === 1).length).toEqual(
        1
      );
      const lastCall = progressFn.mock.calls.slice(-1)[0];
      expect(lastCall[0]).toEqual(1);

      expect(
        dataTransferFn.mock.calls[0][0].type === DataTransferType.Started
      ).toBe(true);
      expect(
        dataTransferFn.mock.calls[2][0].consumedBytes ===
          dataTransferFn.mock.calls[2][0].rwOnceBytes +
            dataTransferFn.mock.calls[1][0].consumedBytes
      ).toBe(true);

      const lastData =
        dataTransferFn.mock.calls[dataTransferFn.mock.calls.length - 2][0];
      expect(
        lastData.type === DataTransferType.Rw &&
          lastData.consumedBytes === lastData.totalBytes
      ).toBe(true);

      expect(
        dataTransferFn.mock.calls[dataTransferFn.mock.calls.length - 1][0]
          .type === DataTransferType.Succeed
      ).toBe(true);
    },
    NEVER_TIMEOUT
  );

  it(
    'putObjectFromFile',
    async () => {
      const client = new TOS(tosOptions);
      const progressFn = jest.fn();
      const dataTransferFn = jest.fn();
      await client.putObjectFromFile({
        key: 'putObjectFromFile-put-buffer-10M',
        filePath: objectPath10M,
        dataTransferStatusChange: dataTransferFn,
        progress: progressFn,
      });
      expect(
        dataTransferFn.mock.calls[0][0].type === DataTransferType.Started
      ).toBe(true);
      expect(
        dataTransferFn.mock.calls[2][0].consumedBytes ===
          dataTransferFn.mock.calls[2][0].rwOnceBytes +
            dataTransferFn.mock.calls[1][0].consumedBytes
      ).toBe(true);

      const lastData =
        dataTransferFn.mock.calls[dataTransferFn.mock.calls.length - 2][0];
      expect(lastData.type).toBe(DataTransferType.Rw);
      expect(lastData.consumedBytes).toBe(lastData.totalBytes);

      expect(
        dataTransferFn.mock.calls[dataTransferFn.mock.calls.length - 1][0]
          .type === DataTransferType.Succeed
      ).toBe(true);
    },
    NEVER_TIMEOUT
  );
});
