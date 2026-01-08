import { ACLType, StorageClassType } from '../../TosExportEnum';
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

export interface GetFetchTaskInput {
  bucket?: string;
  taskId: string;
}

interface UserMeta {
  Key?: string;
  Value?: string;
}

export interface FetchTask {
  URL?: string;
  IgnoreSameKey?: boolean;
  ContentMD5?: string;
  Bucket?: string;
  Object?: string;
  CallbackURL?: string;
  CallbackHost?: string;
  CallbackBodyType?: string;
  CallbackBody?: string;
  StorageClass?: StorageClassType;
  Acl?: ACLType;
  GrantFullControl?: string;
  GrantRead?: string;
  GrantReadAcp?: string;
  GrantWrite?: string;
  GrantWriteAcp?: string;
  SSECAlgorithm?: string;
  SSECKey?: string;
  SSECKeyMD5?: string;
  Meta?: UserMeta[];
  UserMeta?: UserMeta[];
}

export interface GetFetchTaskOutput {
  State: string;
  Err: string;
  Task: FetchTask;
}

export async function getFetchTask(this: TOSBase, input: GetFetchTaskInput) {
  const res = await this.fetchBucket<GetFetchTaskOutput>(
    input.bucket,
    'GET',
    {
      fetchTask: '',
      taskId: input.taskId,
    },
    {},
    {},
    {
      needMd5: true,
    }
  );

  if (res.data.Task) {
    res.data.Task.Meta = res.data.Task.UserMeta;
  }

  return res;
}
