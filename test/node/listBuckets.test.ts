import { TOS } from '../../src';
import { tosOptions, testProjectName, testBucketNameWithProjectName } from '../utils/options';
describe('test list buckets', () => {
  it('with projectName', async () => {
    const client = new TOS(tosOptions);
    const res = await client.listBuckets({
      projectName: testProjectName,
    });

    expect(res.statusCode).toBe(200);
  });
});
