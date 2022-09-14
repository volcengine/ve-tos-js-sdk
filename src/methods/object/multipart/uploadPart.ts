import { getSize, isBuffer } from '../utils';
import TOSBase from '../../base';
import TosClientError from '../../../TosClientError';
import fs, { Stats } from 'fs';
import * as fsp from '../../../nodejs/fs-promises';
import { DataTransferStatus, DataTransferType } from '../../../interface';
import { EmitReadStream } from '../../../nodejs/EmitReadStream';
import { Readable } from 'stream';
import { safeAwait } from '../../../utils';

export interface UploadPartInput {
  body: Blob | Buffer | NodeJS.ReadableStream;
  bucket?: string;
  key: string;
  partNumber: number;
  uploadId: string;
  dataTransferStatusChange?: (status: DataTransferStatus) => void;
  /**
   * the simple progress feature
   * percent is [0, 1].
   *
   * since uploadPart is stateless, so if `uploadPart` fail and you retry it,
   * `percent` will start from 0 again rather than from the previous value.
   */
  progress?: (percent: number) => void;
  headers?: {
    [key: string]: string | undefined;
    'content-length'?: string;
    'content-md5'?: string;
    'x-tos-server-side-encryption-customer-algorithm'?: string;
    'x-tos-server-side-encryption-customer-key'?: string;
    'x-tos-server-side-encryption-customer-key-MD5'?: string;
  };
}

export interface UploadPartOutput {
  ETag: string;
}

export async function uploadPart(this: TOSBase, input: UploadPartInput) {
  const { uploadId, partNumber, body } = input;
  const headers = input.headers || {};
  const size = getSize(body);
  if (size && headers['content-length'] == null) {
    // browser will error: Refused to set unsafe header "content-length"
    if (process.env.TARGET_ENVIRONMENT === 'node') {
      headers['content-length'] = size.toFixed(0);
    }
  }
  const totalSize = getSize(input.body, headers);
  const totalSizeValid = totalSize != null;
  if (!totalSizeValid && (input.dataTransferStatusChange || input.progress)) {
    console.warn(
      `Don't get totalSize of uploadPart's body, the \`dataTransferStatusChange\` callback will not trigger. You can use \`uploadPartFromFile\` instead`
    );
  }

  let consumedBytes = 0;
  const { dataTransferStatusChange, progress } = input;
  const triggerDataTransfer = (
    type: DataTransferType,
    rwOnceBytes: number = 0
  ) => {
    // request cancel will make rwOnceBytes < 0 in browser
    if (!totalSizeValid || rwOnceBytes < 0) {
      return;
    }
    if (!dataTransferStatusChange && !progress) {
      return;
    }
    consumedBytes += rwOnceBytes;

    dataTransferStatusChange?.({
      type,
      rwOnceBytes,
      consumedBytes,
      totalBytes: totalSize,
    });

    const progressValue = (() => {
      if (totalSize === 0) {
        if (type === DataTransferType.Succeed) {
          return 1;
        }
        return 0;
      }
      return consumedBytes / totalSize;
    })();
    if (progressValue === 1) {
      if (type === DataTransferType.Succeed) {
        progress?.(progressValue);
      } else {
        // not exec progress
      }
    } else {
      progress?.(progressValue);
    }
  };
  let newBody = input.body;
  if (process.env.TARGET_ENVIRONMENT === 'node') {
    const body = input.body;
    if (totalSizeValid && (isBuffer(body) || body instanceof Readable)) {
      newBody = new EmitReadStream(body, totalSize, n =>
        triggerDataTransfer(DataTransferType.Rw, n)
      ).stream();
    }
  }

  triggerDataTransfer(DataTransferType.Started);
  const [err, res] = await safeAwait(
    this.fetchObject<UploadPartOutput>(
      input,
      'PUT',
      { partNumber, uploadId },
      headers,
      newBody,
      {
        handleResponse: res => ({ ETag: res.headers.etag }),
        axiosOpts: {
          onUploadProgress: event => {
            triggerDataTransfer(
              DataTransferType.Rw,
              event.loaded - consumedBytes
            );
          },
        },
      }
    )
  );

  // FAQ: no etag
  if (process.env.TARGET_ENVIRONMENT === 'browser') {
    if (res && !res.data.ETag) {
      throw new TosClientError(
        "No ETag in uploadPart's response, please see https://www.volcengine.com/docs/6349/127737 to fix CORS problem"
      );
    }
  }

  if (err || !res) {
    triggerDataTransfer(DataTransferType.Failed);
    throw err;
  }

  triggerDataTransfer(DataTransferType.Succeed);
  return res;
}

interface UploadPartFromFileInput extends Omit<UploadPartInput, 'body'> {
  filePath: string;
  /**
   * default: 0
   */
  offset?: number;

  /**
   * default: file size
   */
  partSize?: number;
}
export async function uploadPartFromFile(
  this: TOSBase,
  input: UploadPartFromFileInput
) {
  if (process.env.TARGET_ENVIRONMENT !== 'node') {
    throw new TosClientError(
      "uploadPartFromFile doesn't support in browser environment"
    );
  }

  const stats: Stats = await fsp.stat(input.filePath);
  const start = input.offset ?? 0;
  const end = start + (input.partSize ?? stats.size);
  const stream = fs.createReadStream(input.filePath, {
    start,
    end: end - 1,
  }) as NodeJS.ReadableStream;

  return uploadPart.call(this, {
    ...input,
    body: stream,
    headers: {
      ...(input.headers || {}),
      ['content-length']: `${end - start}`,
    },
  });
}
