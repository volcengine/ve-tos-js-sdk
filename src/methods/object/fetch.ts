import { StorageClassType } from '../../TosExportEnum';
import { Acl } from '../../interface';
import { fillRequestHeaders, normalizeHeadersKey } from '../../utils';
import TOSBase from '../base';

export interface FetchObjectInput {
  bucket?: string;
  key: string;
  url: string;
  ignoreSameKey?: boolean;

  acl?: Acl;
  grantFullControl?: string;
  grantRead?: string;
  grantReadAcp?: string;
  grantWriteAcp?: string;
  storageClass?: StorageClassType;

  ssecAlgorithm?: string;
  ssecKey?: string;
  ssecKeyMD5?: string;
  meta?: Record<string, string>;

  // contentMD5 is the base64 encoded of object's md5
  contentMD5?: string;

  headers?: {
    [key: string]: string | undefined;
  };
}

export interface FetchObjectOutput {
  VersionID?: string;
  Etag: string;
  SSECAlgorithm?: string;
  SSECKeyMD5?: string;
}

export async function fetchObject(this: TOSBase, input: FetchObjectInput) {
  const headers = (input.headers = normalizeHeadersKey(input.headers));
  fillRequestHeaders(input, [
    'acl',
    'grantFullControl',
    'grantRead',
    'grantReadAcp',
    'grantWriteAcp',
    'ssecAlgorithm',
    'ssecKey',
    'ssecKeyMD5',
    'meta',
    'storageClass',
  ]);
  const res = await this._fetchObject<FetchObjectOutput>(
    input,
    'POST',
    {
      fetch: '',
    },
    headers,
    {
      URL: input.url,
      IgnoreSameKey: input.ignoreSameKey,
      ContentMD5: input.contentMD5,
    },
    {
      needMd5: true,
    }
  );
  return res;
}

export interface PutFetchTaskInput {
  bucket?: string;
  key: string;
  url: string;
  ignoreSameKey?: boolean;

  acl?: Acl;
  grantFullControl?: string;
  grantRead?: string;
  grantReadAcp?: string;
  grantWriteAcp?: string;
  storageClass?: StorageClassType;

  ssecAlgorithm?: string;
  ssecKey?: string;
  ssecKeyMD5?: string;
  meta?: Record<string, string>;

  // contentMD5 is the base64 encoded of object's md5
  contentMD5?: string;

  headers?: {
    [key: string]: string | undefined;
  };
}

export interface PutFetchTaskOutput {
  TaskId: string;
}

export async function putFetchTask(this: TOSBase, input: PutFetchTaskInput) {
  const headers = (input.headers = normalizeHeadersKey(input.headers));
  fillRequestHeaders(input, [
    'acl',
    'grantFullControl',
    'grantRead',
    'grantReadAcp',
    'grantWriteAcp',
    'ssecAlgorithm',
    'ssecKey',
    'ssecKeyMD5',
    'meta',
    'storageClass',
  ]);

  const res = await this._fetchObject<PutFetchTaskOutput>(
    input,
    'POST',
    {
      fetchTask: '',
    },
    headers,
    {
      URL: input.url,
      IgnoreSameKey: input.ignoreSameKey,
      ContentMD5: input.contentMD5,
      Object: input.key,
    },
    {
      needMd5: true,
    }
  );
  return res;
}
