import TOS from '../../src';
import { Bucket } from '../../src/methods/bucket/base';
import {
  isNeedDeleteBucket,
  testBucketName,
  testBucketRenameBucketName,
  testCRRTargetBucketName,
  testPreSignedPolicyBucketName,
  tosCRRTargetOptions,
  tosOptions,
} from './options';

export const deleteBucket = async (bucketItem: Bucket) => {
  const bucket = bucketItem.Name;
  const client = new TOS({
    ...tosOptions,
    region: bucketItem.Location,
    endpoint: bucketItem.ExtranetEndpoint,
  });
  // delete objects
  const { data: objects } = await client.listObjects({ bucket });
  for (const object of objects.Contents) {
    await client.deleteObject({ bucket, key: object.Key });
  }
  // delete multipart uploads
  const { data: uploadRes } = await client.listMultipartUploads({ bucket });
  for (const upload of uploadRes.Uploads || []) {
    await client.abortMultipartUpload({
      bucket,
      key: upload.Key,
      uploadId: upload.UploadId,
    });
  }
  // delete versions
  const { data: versions } = await client.listObjects({
    bucket,
    versions: '',
  });
  for (const object of versions.Versions.concat(versions.DeleteMarkers)) {
    await client.deleteObject({
      bucket,
      key: object.Key,
      versionId: object.VersionId,
    });
  }
  await client.deleteBucket(bucket);
};

async function sleep(time: number) {
  await new Promise((r) => setTimeout(r, time));
}

export async function sleepCache(time = 12 * 1000) {
  await sleep(time); // 12s
}

export const NEVER_TIMEOUT = 5 * 60 * 1000;

export async function testCheckErr(
  f: () => void,
  checkErr?: string | ((err: any) => boolean)
) {
  try {
    await f();
  } catch (_err) {
    const err = _err as any;
    if (!checkErr) {
      return;
    }

    if (typeof checkErr === 'string') {
      expect(err.toString().includes(checkErr)).toBeTruthy();
    } else {
      expect(checkErr(err)).toBeTruthy();
    }
    return;
  }
  // debugger;
  throw Error('testCheckErr never go here'); // never go here
}

export const streamToBuf = async (
  stream: NodeJS.ReadableStream
): Promise<Buffer> => {
  let buf = Buffer.from([]);
  return new Promise((resolve, reject) => {
    stream.on('data', (data) => {
      buf = Buffer.concat([buf, data]);
    });
    stream.on('end', () => {
      resolve(buf);
    });
    stream.on('error', (err) => {
      reject(err);
    });
  });
};

// 所有的桶创建都放在这里，因为桶创建后需要等待一段时间。
export async function createAllTestBuckets() {
  const client = new TOS(tosOptions);
  // clear all bucket
  const { data: buckets } = await client.listBuckets();
  for (const bucket of buckets.Buckets) {
    if (isNeedDeleteBucket(bucket.Name)) {
      try {
        await deleteBucket(bucket);
      } catch (err) {
        console.log('a: ', err);
      }
    }
  }

  // create bucket
  await client.createBucket({
    bucket: testBucketName,
  });
  await client.createBucket({
    bucket: testBucketRenameBucketName,
  });
  await client.createBucket({
    bucket: testPreSignedPolicyBucketName,
  });

  const crrTargetClient = new TOS(tosCRRTargetOptions);
  await crrTargetClient.createBucket({
    bucket: testCRRTargetBucketName,
  });

  // 创桶之后立即操作，很多操作都会偶发失败
  await sleepCache(30_000);
}
