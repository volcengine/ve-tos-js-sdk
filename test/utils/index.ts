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

export async function sleepCache(time = 12 * 1000) {
  await sleep(time); // 12s
}

export const NEVER_TIMEOUT = 5 * 60 * 1000;

export async function testCheckErr(
  f: () => void,
  msg?: string | ((msg: string) => boolean)
) {
  try {
    await f();
    // debugger;
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

export const streamToBuf = async (
  stream: NodeJS.ReadableStream
): Promise<Buffer> => {
  let buf = Buffer.from([]);
  return new Promise((resolve, reject) => {
    stream.on('data', data => {
      buf = Buffer.concat([buf, data]);
    });
    stream.on('end', () => {
      resolve(buf);
    });
    stream.on('error', err => {
      reject(err);
    });
  });
};
