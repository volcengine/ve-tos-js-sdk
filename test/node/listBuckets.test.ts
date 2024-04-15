import { TOS } from '../../src';
import { tosOptions, testProjectName, testBucketNameWithProjectName } from '../utils/options';

describe('test list buckets', () => {
  it('with projectName', async () => {
    const client = new TOS(tosOptions);
    const res = await client.listBuckets({
      projectName: testProjectName,
    });
    const bucket = res.data.Buckets.find(b => b.Name === testBucketNameWithProjectName);
    expect(bucket?.Name).not.toBeUndefined();
  });
});
