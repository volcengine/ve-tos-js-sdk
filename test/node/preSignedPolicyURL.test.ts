import axios from 'axios';
import TOS from '../../src/browser-index';
import { NEVER_TIMEOUT, sleepCache, testCheckErr } from '../utils';
import {
  specialCharKey,
  tosOptions as commonTosOptions,
  testPreSignedPolicyBucketName,
} from '../utils/options';

const tosOptions = {
  ...commonTosOptions,
  bucket: testPreSignedPolicyBucketName,
};

const allTestObjectKeys = [
  '1',
  '2',
  '2/1',
  '2/2',
  '22/1',
  '22/2',
  '3',
  '3/',
  `${specialCharKey}`,
  `${specialCharKey}/1`,
  `${specialCharKey}/2`,
];
describe('preSignedPolicyURL', () => {
  beforeAll(async (done) => {
    const client = new TOS(tosOptions);
    for (const key of allTestObjectKeys) {
      await client.putObject(key);
    }

    done();
  }, NEVER_TIMEOUT);

  it(
    'for all objects',
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
      const { data } = await axios(preSignedPolicyURLRet.getSignedURLForList());
      expect(data.Contents.length).toEqual(allTestObjectKeys.length);
      const { headers } = await axios(
        preSignedPolicyURLRet.getSignedURLForGetOrHead('22/2')
      );
      expect(+headers['content-length']).toEqual(0);
    },
    NEVER_TIMEOUT
  );

  it(
    'eq one',
    async () => {
      const client = new TOS(tosOptions);
      const preSignedPolicyURLRet = client.preSignedPolicyURL({
        conditions: [
          {
            key: 'key',
            value: '1',
          },
        ],
      });
      await testCheckErr(() =>
        axios(preSignedPolicyURLRet.getSignedURLForList())
      );
      await testCheckErr(() =>
        axios(preSignedPolicyURLRet.getSignedURLForList({ prefix: '1' }))
      );
      const { headers } = await axios(
        preSignedPolicyURLRet.getSignedURLForGetOrHead('1')
      );
      expect(+headers['content-length']).toEqual(0);
    },
    NEVER_TIMEOUT
  );

  it(
    'starts-with one',
    async () => {
      const client = new TOS(tosOptions);
      const startOne = '2/';
      const preSignedPolicyURLRet = client.preSignedPolicyURL({
        conditions: [
          {
            key: 'key',
            value: startOne,
            operator: 'starts-with',
          },
        ],
      });
      const { data } = await axios(
        preSignedPolicyURLRet.getSignedURLForList({ prefix: startOne })
      );
      expect(data.Contents.length).toEqual(
        allTestObjectKeys.filter((it) => it.startsWith(startOne)).length
      );
      const { headers } = await axios(
        preSignedPolicyURLRet.getSignedURLForGetOrHead('2/2')
      );
      expect(+headers['content-length']).toEqual(0);

      await testCheckErr(() =>
        axios(preSignedPolicyURLRet.getSignedURLForList())
      );
      await testCheckErr(() =>
        axios(preSignedPolicyURLRet.getSignedURLForList({ prefix: '22/' }))
      );
    },
    NEVER_TIMEOUT
  );

  it(
    'multi eq and starts-with',
    async () => {
      const client = new TOS(tosOptions);
      const preSignedPolicyURLRet = client.preSignedPolicyURL({
        conditions: [
          {
            key: 'key',
            value: '1',
          },
          {
            key: 'key',
            value: '2',
            operator: 'eq',
          },
          {
            key: 'key',
            value: '2/',
            operator: 'starts-with',
          },
          {
            key: 'key',
            value: '22/',
            operator: 'starts-with',
          },
        ],
      });
      await axios(preSignedPolicyURLRet.getSignedURLForList({ prefix: '2/' }));
      await axios(preSignedPolicyURLRet.getSignedURLForList({ prefix: '22/' }));
      await testCheckErr(() =>
        axios(preSignedPolicyURLRet.getSignedURLForList({ prefix: '2' }))
      );
      await testCheckErr(() =>
        axios(preSignedPolicyURLRet.getSignedURLForList({ prefix: '3/' }))
      );

      async function testOneObj(key: string) {
        const { headers } = await axios(
          preSignedPolicyURLRet.getSignedURLForGetOrHead(key)
        );
        expect(+headers['content-length']).toEqual(0);
      }
      await testOneObj('1');
      await testOneObj('2');
      await testOneObj('2/1');
      await testOneObj('22/1');
      await testCheckErr(() =>
        axios(preSignedPolicyURLRet.getSignedURLForGetOrHead('3'))
      );
    },
    NEVER_TIMEOUT
  );

  it(
    'invalid params',
    async () => {
      await testCheckErr(() => {
        const client = new TOS({ ...tosOptions, bucket: undefined });

        client.preSignedPolicyURL({
          conditions: [
            {
              key: 'key',
              value: '1',
            },
          ],
        });
      }, 'bucket');

      const client = new TOS(tosOptions);
      await testCheckErr(
        () =>
          client.preSignedPolicyURL({
            conditions: [],
          }),
        'conditions'
      );

      await testCheckErr(
        () =>
          client.preSignedPolicyURL({
            conditions: [
              {
                key: 'key222' as 'key',
                value: '1',
              },
            ],
          }),
        'key'
      );

      await testCheckErr(
        () =>
          client.preSignedPolicyURL({
            conditions: [
              {
                key: 'key',
                value: '1',
                operator: 'operator' as 'eq',
              },
            ],
          }),
        'operator'
      );
    },
    NEVER_TIMEOUT
  );
});
