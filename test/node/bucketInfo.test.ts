import TOS, { TosServerError } from '../../src/browser-index';
import { tosOptions } from '../utils/options';
import { NEVER_TIMEOUT, testCheckErr } from '../utils';

describe('nodejs bucket basic api', () => {
  it(
    'if bucket exist',
    async () => {
      const client = new TOS(tosOptions);
      await testCheckErr(
        () => client.headBucket('not-exist-bucket'),
        (error: any) => {
          if (error instanceof TosServerError) {
            if (error.statusCode === 404) {
              return true;
            }
          }
          return false;
        }
      );
    },
    NEVER_TIMEOUT
  );

  it(
    'bucket information',
    async () => {
      const client = new TOS(tosOptions);
      const bucketName = 'test-bucket-info-project' + Date.now();

      try {
        await client.createBucket({
          bucket: bucketName,
          projectName: 'not-exist-project',
        });
      } catch (error: any) {
        expect(error.code).toBe('NoSuchIAMProject');
      }
      await client.createBucket({
        bucket: bucketName,
      });
      const { data } = await client.headBucket(bucketName);
      expect(data['x-tos-bucket-region']).toBe(tosOptions.region);
      expect(data['x-tos-storage-class']).toBeTruthy();
      expect(data.ProjectName).toBe('default');

      await client.deleteBucket(bucketName);
    },
    NEVER_TIMEOUT
  );

  // it(
  //   'create posix bucket',
  //   async () => {
  //     const client = new TOS(tosOptions);
  //     const bucketName = 'test-bucket-info-project' + Date.now();
  //     await client.createBucket({
  //       bucket: bucketName,
  //       bucketType: 'POSIX',
  //     });
  //     const { data } = await client.headBucket(bucketName);
  //     expect(data['x-tos-bucket-type']).toBe('POSIX');
  //     expect(data['x-tos-storage-class']).toBeTruthy();
  //     expect(data.ProjectName).toBe('default');
  //   },
  //   NEVER_TIMEOUT
  // );
});
