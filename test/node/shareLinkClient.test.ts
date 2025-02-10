import path from 'path';
import fsp from 'fs/promises';
import { ShareLinkClient } from '../../src/';
import { NEVER_TIMEOUT, sleepCache } from '../utils';
import {
  specialCharKey,
  tosOptions as commonTosOptions,
  testPreSignedPolicyBucketName,
} from '../utils/options';
import { CancelToken, TOS, TosClient } from '../../src';
import { PreSignedPolicyURLOutput } from '../../src/methods/object/preSignedPolicyURL';
import { isBuffer, safeAwait } from '../../src/utils';
import {
  checkpointsDir,
  downloadFileDir,
  objectKey100M,
  objectPath100M,
} from './utils';

const tosOptions = {
  ...commonTosOptions,
  bucket: testPreSignedPolicyBucketName,
};

function getPolicyUrl(
  _client: TosClient,
  preSignedURL: PreSignedPolicyURLOutput
) {
  return preSignedURL.getSignedURLForList();
  // return `https://${client.opts.bucket}.${client.opts.endpoint}?${preSignedURL.signedQuery}`;
}

const allTestObjectKeys = [
  'shareLinkClient-1',
  'shareLinkClient-2',
  'shareLinkClient-2/1',
  'shareLinkClient-2/2',
  'shareLinkClient-22/1',
  'shareLinkClient-22/2',
  'shareLinkClient-3',
  'shareLinkClient-3/',
  `shareLinkClient-${specialCharKey}`,
  `shareLinkClient-${specialCharKey}/1`,
  `shareLinkClient-${specialCharKey}/2`,
];
describe('shareLinkClient', () => {
  beforeAll(async (done) => {
    const client = new TOS(tosOptions);
    for (const key of allTestObjectKeys) {
      await client.putObject(key);
    }

    await client.uploadFile({
      file: objectPath100M,
      key: objectKey100M,
      taskNum: 10,
    });
    done();
  }, NEVER_TIMEOUT);

  it(
    'headObject',
    async () => {
      const client = new TOS(tosOptions);
      const preSignedPolicyURLRet = client.preSignedPolicyURL({
        conditions: [
          {
            key: 'key',
            value: '',
            operator: 'starts-with',
          },
        ],
      });
      const shareLinkClient = new ShareLinkClient({
        policyUrl: getPolicyUrl(client, preSignedPolicyURLRet),
      });
      const { headers } = await shareLinkClient.headObject(
        'shareLinkClient-22/2'
      );
      expect(headers['content-length']).toBe('0');
    },
    NEVER_TIMEOUT
  );

  it(
    'headObject with if-match',
    async () => {
      const client = new TOS(tosOptions);
      const preSignedPolicyURLRet = client.preSignedPolicyURL({
        conditions: [
          {
            key: 'key',
            value: '',
            operator: 'starts-with',
          },
        ],
      });
      const shareLinkClient = new ShareLinkClient({
        policyUrl: getPolicyUrl(client, preSignedPolicyURLRet),
      });
      const [err] = await safeAwait(
        shareLinkClient.headObject({
          key: 'shareLinkClient-22/2',
          ifMatch: 'invalid etag',
        })
      );
      expect(err?.statusCode).toBe(412);

      const { headers } = await shareLinkClient.headObject({
        key: 'shareLinkClient-22/2',
        ifMatch: '"d41d8cd98f00b204e9800998ecf8427e"',
      });
      expect(headers['content-length']).toBe('0');
    },
    NEVER_TIMEOUT
  );

  it(
    'getObject',
    async () => {
      const client = new TOS(tosOptions);
      const preSignedPolicyURLRet = client.preSignedPolicyURL({
        conditions: [
          {
            key: 'key',
            value: '',
            operator: 'starts-with',
          },
        ],
      });
      const shareLinkClient = new ShareLinkClient({
        policyUrl: getPolicyUrl(client, preSignedPolicyURLRet),
      });
      const { headers, data: data2 } = await shareLinkClient.getObjectV2({
        key: 'shareLinkClient-22/2',
        dataType: 'buffer',
      });
      expect(headers['content-length']).toBe('0');
      if (isBuffer(data2.content)) {
        expect(data2.content.length).toBe(0);
      } else {
        throw Error('期望返回 Buffer');
      }
    },
    NEVER_TIMEOUT
  );

  it(
    'getObject with if-match',
    async () => {
      const client = new TOS(tosOptions);
      const preSignedPolicyURLRet = client.preSignedPolicyURL({
        conditions: [
          {
            key: 'key',
            value: '',
            operator: 'starts-with',
          },
        ],
      });
      const shareLinkClient = new ShareLinkClient({
        policyUrl: getPolicyUrl(client, preSignedPolicyURLRet),
      });
      const [err] = await safeAwait(
        shareLinkClient.getObjectV2({
          key: 'shareLinkClient-22/2',
          ifMatch: 'invalid etag',
        })
      );
      expect(err?.statusCode).toBe(412);

      const { headers, data: data2 } = await shareLinkClient.getObjectV2({
        key: 'shareLinkClient-22/2',
        dataType: 'buffer',
        ifMatch: '"d41d8cd98f00b204e9800998ecf8427e"',
      });
      expect(headers['content-length']).toBe('0');
      if (isBuffer(data2.content)) {
        expect(data2.content.length).toBe(0);
      } else {
        throw Error('期望返回 Buffer');
      }
    },
    NEVER_TIMEOUT
  );

  it(
    'list all objects by ShareLinkClient',
    async () => {
      const client = new TOS(tosOptions);
      const preSignedPolicyURLRet = client.preSignedPolicyURL({
        conditions: [
          {
            key: 'key',
            value: '',
            operator: 'starts-with',
          },
        ],
      });
      const shareLinkClient = new ShareLinkClient({
        policyUrl: getPolicyUrl(client, preSignedPolicyURLRet),
      });
      const { data } = await shareLinkClient.listObjects();
      for (const it of allTestObjectKeys) {
        const found = data.Contents.find((it2) => it2.Key === it);
        expect(found).toBeTruthy();
      }
    },
    NEVER_TIMEOUT
  );

  it(
    'list objects by ShareLinkClient-prefix-maxKeys-delimiter-marker',
    async () => {
      const client = new TOS(tosOptions);
      const prefix = 'shareLinkClient-2';
      const preSignedPolicyURLRet = client.preSignedPolicyURL({
        conditions: [
          {
            key: 'key',
            value: prefix,
            operator: 'starts-with',
          },
        ],
      });
      const shareLinkClient = new ShareLinkClient({
        policyUrl: getPolicyUrl(client, preSignedPolicyURLRet),
      });
      const { data } = await shareLinkClient.listObjects({
        prefix,
        maxKeys: 2,
        delimiter: '/',
      });
      expect(data.CommonPrefixes).toStrictEqual([
        { Prefix: 'shareLinkClient-2/' },
      ]);
      expect(data.Contents.length).toBe(1);
      expect(data.Contents[0].Key).toBe('shareLinkClient-2');
      expect(data.IsTruncated).toBe(true);

      const { data: data2 } = await shareLinkClient.listObjects({
        prefix,
        maxKeys: 2,
        delimiter: '/',
        marker: data.NextMarker,
      });
      expect(data2.CommonPrefixes).toStrictEqual([
        { Prefix: 'shareLinkClient-22/' },
      ]);
      expect(data2.Contents.length).toBe(0);
      expect(data2.IsTruncated).toBe(false);
    },
    NEVER_TIMEOUT
  );

  it(
    'list all objects by listObjectsType2',
    async () => {
      const client = new TOS(tosOptions);
      const preSignedPolicyURLRet = client.preSignedPolicyURL({
        conditions: [
          {
            key: 'key',
            value: '',
            operator: 'starts-with',
          },
        ],
      });
      const shareLinkClient = new ShareLinkClient({
        policyUrl: getPolicyUrl(client, preSignedPolicyURLRet),
      });
      const { data } = await shareLinkClient.listObjectsType2();
      for (const it of allTestObjectKeys) {
        const found = data.Contents.find((it2) => it2.Key === it);
        expect(found).toBeTruthy();
      }
      const { headers, data: data2 } = await shareLinkClient.getObjectV2({
        key: 'shareLinkClient-22/2',
        dataType: 'buffer',
      });
      expect(headers['content-length']).toBe('0');
      if (isBuffer(data2.content)) {
        expect(data2.content.length).toBe(0);
      } else {
        throw Error('期望返回 Buffer');
      }
    },
    NEVER_TIMEOUT
  );

  it(
    'listObjectsType2 by ShareLinkClient-prefix-maxKeys-delimiter-continueToken',
    async () => {
      const client = new TOS(tosOptions);
      const prefix = 'shareLinkClient-2';
      const preSignedPolicyURLRet = client.preSignedPolicyURL({
        conditions: [
          {
            key: 'key',
            value: prefix,
            operator: 'starts-with',
          },
        ],
      });
      const shareLinkClient = new ShareLinkClient({
        policyUrl: getPolicyUrl(client, preSignedPolicyURLRet),
      });
      const { data } = await shareLinkClient.listObjectsType2({
        prefix,
        maxKeys: 2,
        delimiter: '/',
      });
      expect(data.CommonPrefixes).toStrictEqual([
        { Prefix: 'shareLinkClient-2/' },
      ]);
      expect(data.Contents.length).toBe(1);
      expect(data.Contents[0].Key).toBe('shareLinkClient-2');
      expect(data.IsTruncated).toBe(true);

      const { data: data2 } = await shareLinkClient.listObjectsType2({
        prefix,
        maxKeys: 2,
        delimiter: '/',
        continuationToken: data.NextContinuationToken,
      });
      expect(data2.CommonPrefixes).toStrictEqual([
        { Prefix: 'shareLinkClient-22/' },
      ]);
      expect(data2.Contents.length).toBe(0);
      expect(data2.IsTruncated).toBe(false);
    },
    NEVER_TIMEOUT
  );

  it(
    'shareLinkClient-download 100M file-pause-resume-right-progress',
    async () => {
      const client = new TOS(tosOptions);
      const prefix = '';
      const preSignedPolicyURLRet = client.preSignedPolicyURL({
        conditions: [
          {
            key: 'key',
            value: prefix,
            operator: 'starts-with',
          },
        ],
      });
      const shareLinkClient = new ShareLinkClient({
        policyUrl: getPolicyUrl(client, preSignedPolicyURLRet),
        enableCRC: true,
      });

      const checkpointPath = path.resolve(
        checkpointsDir,
        `shareLinkClient-download 100M file - pause - resume.checkpoint.json`
      );
      const filePath = path.resolve(
        downloadFileDir,
        'shareLinkClient-download 100M file - pause - resume.txt'
      );
      while (true) {
        const progressFn = jest.fn();
        const cancelTokenSource = CancelToken.source();

        // sleep 3 ~ 6
        const sleepTime = (Math.random() * 3 + 3) * 1000;
        setTimeout(() => {
          cancelTokenSource.cancel();
        }, sleepTime);
        const [err, res] = await safeAwait(
          shareLinkClient.downloadFile({
            filePath,
            key: objectKey100M,
            checkpoint: checkpointPath,
            taskNum: 1,
            progress: progressFn,
            cancelToken: cancelTokenSource.token,
            partSize: 5_000_001,
          })
        );

        const progressFnCallsLen = progressFn.mock.calls.length;
        // console.log('progressFnCallsLen: ', progressFnCallsLen);
        for (let i = 0; i < progressFnCallsLen; ++i) {
          const oneCall = progressFn.mock.calls[i];
          if (oneCall[0] <= 1) {
            // console.log('process: ', oneCall[0]);
            if (oneCall[0] === 1) {
              expect(i).toBe(progressFnCallsLen - 1);
            }
          } else {
            expect(oneCall[0]).toBeLessThanOrEqual(1);
          }

          await sleepCache(sleepTime);
          // 确保 progress 不会接受新的调用
          expect(progressFn.mock.calls.length).toBe(progressFnCallsLen);
        }

        if (err) {
          expect(err.toString().includes('cancel')).toBe(true);
        } else {
          const { size } = await fsp.stat(filePath);
          expect(size).toEqual(100 * 1024 * 1024);
          return;
        }
      }
    },
    NEVER_TIMEOUT
  );
});
