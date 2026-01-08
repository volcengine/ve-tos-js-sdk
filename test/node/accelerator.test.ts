import TOS from '../../src/browser-index';
import { NEVER_TIMEOUT } from '../utils';
import { testAccountId, tosControlOptions } from '../utils/options';

describe('accelerator', () => {
  it(
    'list bind accelerators for accesspoint',
    async () => {
      const client = new TOS(tosControlOptions);
      const res = await client.listBindAcceleratorForAccessPoint({
        AccountId: testAccountId,
        AccessPointName: 'test',
      });
      expect(res.statusCode).toBe(200);
    },
    NEVER_TIMEOUT
  );
});
