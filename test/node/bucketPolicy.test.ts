import TOS from '../../src/browser-index';
import { PutBucketPolicyInput } from '../../src/methods/bucket/policy';
import { deleteBucket, sleepCache, NEVER_TIMEOUT } from '../utils';
import {
  testBucketName,
  isNeedDeleteBucket,
  tosOptions,
} from '../utils/options';

describe('bucketPolicy in node.js environment', () => {
  beforeAll(async done => {
    const client = new TOS(tosOptions);
    // clear all bucket
    const { data: buckets } = await client.listBuckets();
    for (const bucket of buckets.Buckets) {
      if (isNeedDeleteBucket(bucket.Name)) {
        try {
          await deleteBucket(client, bucket.Name);
        } catch (err) {
          console.log('a: ', err);
        }
      }
    }
    // create bucket
    await client.createBucket({
      bucket: testBucketName,
    });
    await sleepCache();
    done();
  }, NEVER_TIMEOUT);
  // afterAll(async done => {
  //   const client = new TOS(tosOptions);
  //   console.log('delete bucket.....');
  //   // delete bucket
  //   deleteBucket(client, testBucketName);
  //   done();
  // }, NEVER_TIMEOUT);

  it(
    'test policy',
    async () => {
      const client = new TOS(tosOptions);
      {
        const { data } = await client.getBucketPolicy(testBucketName);
        expect(data.Statement.length).toEqual(0);
      }

      {
        const body: PutBucketPolicyInput = {
          bucket: testBucketName,
          policy: {
            Statement: [
              {
                Action: ['tos:HeadBucket', 'tos:DeleteBucket'],
                Condition: { StringEquals: { 'tos:Referer': ['', 'aa'] } },
                Effect: 'Allow',
                Principal: ['trn:iam::aaa:user/bbb'],
                Resource: [
                  `trn:tos:::${testBucketName}`,
                  `trn:tos:::${testBucketName}/*`,
                ],
                Sid: 'policy_de2e163a-c492-46d8-91b0-75dbf3cf98ac',
              },
            ],
          },
        };
        await client.putBucketPolicy(body);
      }

      {
        await sleepCache();
        const { data } = await client.getBucketPolicy(testBucketName);
        expect(data.Statement[0].Action).toEqual([
          'tos:HeadBucket',
          'tos:DeleteBucket',
        ]);
      }

      {
        await client.deleteBucketPolicy(testBucketName);
        await sleepCache();
        const { data } = await client.getBucketPolicy(testBucketName);
        expect(data.Statement.length).toEqual(0);
      }
    },
    NEVER_TIMEOUT
  );
});
