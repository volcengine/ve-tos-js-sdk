import { StorageClassInheritDirectiveType } from '../../src/TosExportEnum';
import TOS, { StorageClassType } from '../../src/browser-index';
import { NEVER_TIMEOUT } from '../utils';
import {
  tosOptions,
  testCRRSourceBucketName,
  testCRRTargetBucketName,
  testCRRTargetRegion,
} from '../utils/options';
const CommonTestCasePrefix = 'replication';

describe(`nodejs bucket ${CommonTestCasePrefix}`, () => {
  it(
    `${CommonTestCasePrefix}`,
    async () => {
      const client = new TOS({
        ...tosOptions,
      });

      try {
        const result = await client.getBucketReplication({
          bucket: testCRRSourceBucketName,
        });
        expect(result.data.Rules.length).toBe(0);
      } catch (error) {
        expect(error).toBeFalsy();
      }

      {
        const result = await client.putBucketReplication({
          bucket: testCRRSourceBucketName,
          role: 'ServiceRoleforReplicationAccessTOS',
          rules: [
            {
              ID: '1',
              Status: 'Enabled',
              PrefixSet: ['prefix_1', 'prefix_2'],
              Destination: {
                Bucket: testCRRTargetBucketName,
                Location: testCRRTargetRegion,
                StorageClass: StorageClassType.StorageClassStandard,
                StorageClassInheritDirective:
                  StorageClassInheritDirectiveType.StorageClassInheritDirectiveDestinationBucket,
              },
              HistoricalObjectReplication: 'Enabled',
            },
          ],
        });

        expect(result.data).toBe('');
      }

      {
        const result = await client.getBucketReplication({
          bucket: testCRRSourceBucketName,
          ruleId: '1',
        });

        expect(result.data.Rules.length).toBe(1);
        expect(result.data.Rules.at(0)?.ID).toBe('1');
      }

      {
        const result = await client.getBucketReplication({
          bucket: testCRRSourceBucketName,
        });

        expect(result.data.Rules.length).toBe(1);
        expect(result.data.Rules.at(0)?.ID).toBe('1');
      }

      {
        const result = await client.getBucketReplication({
          bucket: testCRRSourceBucketName,
          ruleId: 'xxxx',
        });

        expect(result.data.Rules.length).toBe(0);
      }

      {
        const result = await client.deleteBucketReplication({
          bucket: testCRRSourceBucketName,
        });

        expect(result.data).toBe('');
      }

      {
        const result = await client.getBucketReplication({
          bucket: testCRRSourceBucketName,
        });
        expect(result.data.Rules.length).toBe(0);
      }
    },
    NEVER_TIMEOUT
  );
});
