import TOS from '../../src';
import {
  isNeedDeleteBucket,
  testBucketName,
  testBucketRenameBucketName,
  testCRRSourceBucketName,
  testCRRTargetBucketName,
  testNoVersionBucketName,
  testPreSignedPolicyBucketName,
  testSymlinkBucketName,
  tosCRRSourceOptions,
  tosCRRTargetOptions,
  tosOptions,
  tosSymlinkOptions,
} from './options';
import { clearBucket } from '.';

// 所有的桶创建都放在这里，因为桶创建后需要等待一段时间。
export async function createAllTestBuckets() {
  const client = new TOS(tosOptions);
  // clear all bucket
  const { data: buckets } = await client.listBuckets();
  for (const bucket of buckets.Buckets) {
    if (isNeedDeleteBucket(bucket.Name)) {
      try {
        // 当前删除后重新创建同名 Bucket 会失败，缓存时间较长。
        // 所以考虑清空数据作为替代方案
        await clearBucket(bucket);
      } catch (err) {
        console.log('a: ', err);
      }
    }
  }

  const createBucketIfNotExist = async (
    bucket: string,
    createFn?: () => Promise<unknown>
  ) => {
    const isExist = buckets.Buckets.some((it) => it.Name === bucket);
    if (isExist) {
      return;
    }
    const defaultCreateFn = () => client.createBucket({ bucket });
    createFn = createFn || defaultCreateFn;
    await createFn();
  };

  // create bucket
  await createBucketIfNotExist(testBucketName);
  await createBucketIfNotExist(testBucketRenameBucketName);
  await createBucketIfNotExist(testPreSignedPolicyBucketName);
  await createBucketIfNotExist(testCRRSourceBucketName, async () => {
    const client = new TOS(tosCRRSourceOptions);
    await client.createBucket({
      bucket: testCRRSourceBucketName,
    });
  });
  await createBucketIfNotExist(testCRRTargetBucketName, async () => {
    const client = new TOS(tosCRRTargetOptions);
    await client.createBucket({
      bucket: testCRRTargetBucketName,
    });
  });
  await createBucketIfNotExist(testSymlinkBucketName, async () => {
    const client = new TOS(tosSymlinkOptions);
    await client.createBucket({
      bucket: testSymlinkBucketName,
    });
  });
  await createBucketIfNotExist(testNoVersionBucketName);

  // create bucket
  // await client.createBucket({
  //   bucket: testBucketName,
  // });
  // await client.createBucket({
  //   bucket: testBucketRenameBucketName,
  // });
  // await client.createBucket({
  //   bucket: testPreSignedPolicyBucketName,
  // });
  // const crrSourceClient = new TOS(tosCRRSourceOptions);
  // await crrSourceClient.createBucket({
  //   bucket: testCRRSourceBucketName,
  // });
  // const crrTargetClient = new TOS(tosCRRTargetOptions);
  // await crrTargetClient.createBucket({
  //   bucket: testCRRTargetBucketName,
  // });

  // 创桶之后立即操作，很多操作都会偶发失败
  // await sleepCache(30_000);
}
