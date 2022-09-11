import fs from 'fs';
import TosClientError from '../../TosClientError';
import { Headers } from '../../interface';
import { normalizeHeaders } from '../../utils';
import TOSBase, { TosResponse } from '../base';

export interface GetObjectInput {
  bucket?: string;
  key: string;
  versionId?: string;
  headers?: {
    [key: string]: string | undefined;
    'If-Modified-Since'?: string;
    'If-Unmodified-Since'?: string;
    'If-Match'?: string;
    'If-None-Match'?: string;
    'x-tos-server-side-encryption-customer-key'?: string;
    'x-tos-server-side-encryption-customer-key-md5'?: string;
    'x-tos-server-side-encryption-customer-algorithm'?: string;
    Range?: string;
  };
  response?: Headers & {
    'cache-control'?: string;
    'content-disposition'?: string;
    'content-encoding'?: string;
    'content-language'?: string;
    'content-type'?: string;
    expires?: string;
  };
}

export async function getObject(this: TOSBase, input: GetObjectInput | string) {
  const normalizedInput = typeof input === 'string' ? { key: input } : input;
  const query: Record<string, any> = {};
  if (normalizedInput.versionId) {
    query.versionId = normalizedInput.versionId;
  }
  const headers: Headers = normalizeHeaders(normalizedInput?.headers);
  const response: Partial<Headers> = normalizedInput?.response || {};
  Object.keys(response).forEach((key: string) => {
    const v = response[key];
    if (v != null) {
      query[`response-${key}`] = v;
    }
  });

  // TODO: test `stream` in browser environment
  // maybe add `dataType` options. Developer must pass dataType to `arraybuffer` in environment.
  const responseType =
    process.env.TARGET_ENVIRONMENT === 'node' ? 'stream' : 'arraybuffer';

  // TODO: maybe need to return response's headers
  return this.fetchObject<NodeJS.ReadableStream | Buffer>(
    input,
    'GET',
    query,
    headers,
    undefined,
    {
      axiosOpts: { responseType },
    }
  );
}

interface GetObjectToFileInput extends GetObjectInput {
  filePath: string;
}

export async function getObjectToFile(
  this: TOSBase,
  input: GetObjectToFileInput
): Promise<TosResponse<undefined>> {
  if (process.env.TARGET_ENVIRONMENT !== 'node') {
    throw new TosClientError(
      "getObjectToFile doesn't support in browser environment"
    );
  }

  return new Promise(async (resolve, reject) => {
    const getObjectRes = await getObject.call(this, input);
    const stream = getObjectRes.data as NodeJS.ReadableStream;

    const fsWriteStream = fs.createWriteStream(input.filePath);
    stream.pipe(fsWriteStream);
    fsWriteStream.on('error', err => reject(err));
    fsWriteStream.on('finish', () =>
      resolve({ ...getObjectRes, data: undefined })
    );
  });
}

export default getObject;
