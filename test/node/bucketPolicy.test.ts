import TOS from '../../src/browser-index';
import { PutBucketPolicyInput } from '../../src/methods/bucket/policy';
import { sleepCache, NEVER_TIMEOUT } from '../utils';
import { testBucketName, tosOptions } from '../utils/options';

describe('bucketPolicy in node.js environment', () => {
  it(
    'test policy',
    async () => {
      const client = new TOS(tosOptions);
      {
        // reset
        await client.deleteBucketPolicy(testBucketName);
        await sleepCache();
      }

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
