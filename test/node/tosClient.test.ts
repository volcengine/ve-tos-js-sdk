import { TosClient } from '../../src';
import { tosOptions } from '../utils/options';

describe('test init TosClient', () => {
  it('trim options', async () => {
    const newTosOptions: any = { ...tosOptions };

    const trimKeys = [
      'accessKeyId',
      'accessKeySecret',
      'stsToken',
      'region',
      'endpoint',
    ] as const;
    trimKeys.forEach((key) => {
      if (typeof newTosOptions[key] === 'string') {
        newTosOptions[key] = ` ${newTosOptions[key]} `;
      }
    });
    const client = new TosClient(newTosOptions);
    trimKeys.forEach((key: any) => {
      expect((client.opts as any)[key]).toBe((tosOptions as any)[key]);
    });
  });
});
