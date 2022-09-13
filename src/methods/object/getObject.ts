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

/**
 * @deprecated use getObjectV2 instead
 * @returns arraybuffer
 */
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

  // TODO: maybe need to return response's headers
  return this.fetchObject<Buffer>(input, 'GET', query, headers, undefined, {
    axiosOpts: { responseType: 'arraybuffer' },
  });
}

type DataType = 'stream' | 'blob';
export interface GetObjectV2Input {
  bucket?: string;
  key: string;
  versionId?: string;

  /**
   * The type of return value, 'stream' | 'blob'
   * default: 'stream'
   *
   * nodejs environment can use 'stream'.
   *   Because we think that it's unsafe to load all content to memory, we don't provide 'buffer' option.
   * browser environment can use 'blob'
   */
  dataType?: DataType;

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
export interface GetObjectV2Output {
  content: NodeJS.ReadableStream | Blob;
  etag: string;
  lastModified: string;

  // object created before tos server supports crc, hashCrc64ecma will be empty string
  hashCrc64ecma: string;
}

interface GetObjectV2OutputStream extends Omit<GetObjectV2Output, 'content'> {
  content: NodeJS.ReadableStream;
}
interface GetObjectV2InputBlob extends Omit<GetObjectV2Input, 'dataType'> {
  dataType: 'blob';
}
interface GetObjectV2OutputBlob extends Omit<GetObjectV2Output, 'content'> {
  content: Blob;
}

const NODEJS_DATATYPE: DataType[] = ['stream'];
const BROWSER_DATATYPE: DataType[] = ['blob'];

function checkSupportDataType(dataType: DataType) {
  let environment: 'node' | 'browser' = 'node';
  let supportDataTypes: DataType[] = [];
  if (process.env.TARGET_ENVIRONMENT === 'node') {
    environment = 'node';
    supportDataTypes = NODEJS_DATATYPE;
  } else {
    environment = 'browser';
    supportDataTypes = BROWSER_DATATYPE;
  }
  if (!supportDataTypes.includes(dataType)) {
    throw new TosClientError(
      `The value of \`dataType\` only supports \`${supportDataTypes.join(
        ' | '
      )}\` in ${environment} environment`
    );
  }
}

/**
 * `getObjectV2` default returns stream, using `dataType` param to return other type(eg: blob)
 */
async function getObjectV2(
  this: TOSBase,
  input: GetObjectV2InputBlob
): Promise<TosResponse<GetObjectV2OutputBlob>>;
async function getObjectV2(
  this: TOSBase,
  input: GetObjectV2Input | string
): Promise<TosResponse<GetObjectV2OutputStream>>;
async function getObjectV2(
  this: TOSBase,
  input: GetObjectV2Input | string
): Promise<TosResponse<GetObjectV2Output>> {
  const normalizedInput = typeof input === 'string' ? { key: input } : input;
  const dataType = normalizedInput.dataType || 'stream';
  normalizedInput.dataType = dataType;

  checkSupportDataType(dataType);

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

  const responseType = (() => {
    if (dataType === 'stream') {
      return 'stream';
    }
    return 'arraybuffer';
  })();

  const res = await this.fetchObject<any>(
    input,
    'GET',
    query,
    headers,
    undefined,
    {
      axiosOpts: { responseType },
    }
  );

  let resHeaders = res.headers;
  let newData: NodeJS.ReadableStream | Blob = res.data;
  if (dataType === 'blob') {
    newData = new Blob([res.data], {
      type: resHeaders['content-type'],
    });
  }
  const actualRes: TosResponse<GetObjectV2Output> = {
    ...res,
    data: {
      content: newData,
      etag: resHeaders['etag'] || '',
      lastModified: resHeaders['last-modified'] || '',
      hashCrc64ecma: resHeaders['x-tos-hash-crc64ecma'] || '',
    },
  };
  return actualRes;
}

interface GetObjectToFileInput extends Omit<GetObjectV2Input, 'dataType'> {
  filePath: string;
}
interface GetObjectToFileOutput extends Omit<GetObjectV2Output, 'content'> {}

export async function getObjectToFile(
  this: TOSBase,
  input: GetObjectToFileInput
): Promise<TosResponse<GetObjectToFileOutput>> {
  if (process.env.TARGET_ENVIRONMENT !== 'node') {
    throw new TosClientError(
      "getObjectToFile doesn't support in browser environment"
    );
  }

  return new Promise(async (resolve, reject) => {
    const getObjectRes = await getObjectV2.call(this, input);
    const stream = getObjectRes.data.content;

    const fsWriteStream = fs.createWriteStream(input.filePath);
    stream.pipe(fsWriteStream);
    fsWriteStream.on('error', err => reject(err));
    fsWriteStream.on('finish', () => {
      const newData: any = { ...getObjectRes.data };
      delete newData.content;
      resolve({ ...getObjectRes, data: { ...newData } });
    });
  });
}

export { getObjectV2 };
