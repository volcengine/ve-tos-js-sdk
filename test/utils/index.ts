import TOS from '../../src';
import { Bucket } from '../../src/methods/bucket/base';
import { tosOptions } from './options';

export const clearBucket = async (bucketItem: Bucket) => {
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
};

export const deleteBucket = async (bucketItem: Bucket) => {
  const bucket = bucketItem.Name;
  const client = new TOS({
    ...tosOptions,
    region: bucketItem.Location,
    endpoint: bucketItem.ExtranetEndpoint,
  });
  await clearBucket(bucketItem);
  await client.deleteBucket(bucket);
};

async function sleep(time: number) {
  await new Promise((r) => setTimeout(r, time));
}

export async function sleepCache(time = 12 * 1000) {
  await sleep(time); // 12s
}

export const NEVER_TIMEOUT = 10 * 60 * 1000;

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
