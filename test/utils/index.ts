import TOS from '../../src/browser-index';

export const deleteBucket = async (client: TOS, bucket: string) => {
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
  await new Promise(r => setTimeout(r, time));
}

export async function sleepCache() {
  await sleep(12 * 1000); // 12s
}

export const NEVER_TIMEOUT = 10 * 60 * 60 * 1000;

export async function testCheckErr(
  f: () => void,
  msg?: string | ((msg: string) => boolean)
) {
  try {
    await f();
    expect(false).toBeTruthy(); // never go here
  } catch (_err) {
    const err = _err as any;
    if (!msg) {
      return;
    }

    if (typeof msg === 'string') {
      expect(err.toString().includes(msg)).toBeTruthy();
    } else {
      expect(msg(err.toString())).toBeTruthy();
    }
  }
}
