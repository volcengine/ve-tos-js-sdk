import { hashMd5 } from '../universal/crypto';
import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  Method,
} from 'axios';
import { ISigV4Credentials, SignersV4 } from '../signatureV4';
import { Headers } from '../interface';
import TosServerError, { TosServerErrorData } from '../TosServerError';
import { getEndpoint, getSortedQueryString, normalizeProxy } from '../utils';
import version from '../version';
import { TosAgent } from '../nodejs/TosAgent';
import TosClientError from '../TosClientError';
import {
  DEFAULT_CONTENT_TYPE,
  getObjectInputKey,
  lookupMimeType,
  validateObjectName,
} from './object/utils';
import { makeAxiosInst } from '../axios';

export interface TOSConstructorOptions {
  accessKeyId: string;
  accessKeySecret: string;
  stsToken?: string;
  bucket?: string;
  endpoint?: string;
  /**
   * default value: true
   */
  secure?: boolean;
  region: string;
  proxy?:
    | string
    | {
        url: string;
        needProxyParams?: boolean;
      };

  /**
   * default value: true
   */
  enableVerifySSL?: boolean;

  /**
   * default value: true
   */
  autoRecognizeContentType?: boolean;

  /**
   * unit: ms
   * default value: 60s
   */
  requestTimeout?: number;

  /**
   * unit: ms
   * default value: 10s
   */
  connectionTimeout?: number;

  /**
   * default value: 1024
   */
  maxConnections?: number;

  /**
   * unit: ms
   * default value: 60s
   */
  idleConnectionTime?: number;

  /**
   * default value: 3
   */
  maxRetryCount?: number;
}

interface NormalizedTOSConstructorOptions extends TOSConstructorOptions {
  endpoint: string;
  enableVerifySSL: boolean;
  autoRecognizeContentType: boolean;
  requestTimeout: number;
  connectionTimeout: number;
  maxConnections: number;
  idleConnectionTime: number;
  maxRetryCount: number;
}

interface GetSignatureQueryInput {
  bucket: string;
  method: Method;
  path: string;
  subdomain: boolean;
  // unit: second
  expires: number;
  query?: Record<string, any>;
}

interface FetchOpts<T> {
  needMd5?: boolean;
  handleResponse?: (response: AxiosResponse<T>) => T;
  subdomainBucket?: string;
  axiosOpts?: AxiosRequestConfig;
}

export interface TosResponse<T> {
  data: T;

  statusCode: number;
  headers: Headers;
  /**
   * identifies the errored request, equals to headers['x-tos-request-id'].
   * If you has any question about the request, please send the requestId and id2 to TOS worker.
   */
  requestId: string;

  /**
   * identifies the errored request, equals to headers['x-tos-id-2'].
   * If you has any question about the request, please send the requestId and id2 to TOS worker.
   */
  id2: string;
}

export class TOSBase {
  opts: NormalizedTOSConstructorOptions;

  axiosInst: AxiosInstance;

  userAgent: string;

  private httpAgent: unknown;
  private httpsAgent: unknown;

  constructor(_opts: TOSConstructorOptions) {
    this.opts = this.normalizeOpts(_opts);

    if (process.env.TARGET_ENVIRONMENT === 'node') {
      this.httpAgent = TosAgent({ tosOpts: { ...this.opts, isHttps: false } });
      this.httpsAgent = TosAgent({ tosOpts: { ...this.opts, isHttps: true } });
    }

    this.userAgent = this.getUserAgent();
    this.axiosInst = makeAxiosInst(this.opts.maxRetryCount);
  }

  private normalizeOpts(_opts: TOSConstructorOptions) {
    const mustKeys = ['accessKeyId', 'accessKeySecret', 'region'];
    const mustKeysErrorStr = mustKeys
      .filter(key => !(_opts as any)[key])
      .join(', ');

    if (mustKeysErrorStr) {
      throw new TosClientError(`lack params: ${mustKeysErrorStr}.`);
    }

    const endpoint = _opts.endpoint || getEndpoint(_opts.region);
    if (!endpoint) {
      throw new TosClientError(
        `the value of param region is invalid, correct values are cn-beijing, cn-nantong etc.`
      );
    }

    const secure = _opts.secure == null ? true : !!_opts.secure;
    const _default = <T extends unknown>(
      v: T | undefined | null,
      defaultValue: T
    ) => (v == null ? defaultValue : v);

    return {
      ..._opts,
      endpoint,
      secure,
      enableVerifySSL: _default(_opts.enableVerifySSL, true),
      autoRecognizeContentType: _default(_opts.autoRecognizeContentType, true),
      requestTimeout: _default(_opts.requestTimeout, 60_000),
      connectionTimeout: _default(_opts.connectionTimeout, 10_000),
      maxConnections: _default(_opts.maxConnections, 1024),
      idleConnectionTime: _default(_opts.idleConnectionTime, 60_000),
      maxRetryCount: _default(_opts.maxRetryCount, 3),
    };
  }

  private getUserAgent() {
    // tos-{language}-sdk/{version}
    const language =
      process.env.TARGET_ENVIRONMENT === 'browser' ? 'js' : 'nodejs';
    return `tos-${language}-sdk/${version}`;
  }

  protected async fetch<Data>(
    method: Method,
    path: string,
    query: Record<string, any>,
    headers: Headers,
    body?: Object | File | Blob | NodeJS.ReadableStream,
    opts?: FetchOpts<Data>
  ): Promise<TosResponse<Data>> {
    const handleResponse = opts?.handleResponse || (res => res.data);
    const needMd5 = opts?.needMd5 || false;

    if (body && needMd5) {
      const md5String = hashMd5(JSON.stringify(body), 'base64');
      headers['content-md5'] = md5String;
    }

    const [endpoint, newPath] = (() => {
      if (opts?.subdomainBucket) {
        // endpoint is ip address
        if (/^(\d|:)/.test(this.opts.endpoint)) {
          return [this.opts.endpoint, `/${opts.subdomainBucket}${path}`];
        }
        return [`${opts?.subdomainBucket}.${this.opts.endpoint}`, path];
      }
      return [this.opts.endpoint, path];
    })();
    path = newPath;

    const signOpt = {
      // TODO: delete endpoints and buckets
      endpoints: undefined,
      bucket: '',

      method,
      headers: { ...headers },
      path,
      query: getSortedQueryString(query),
      host: endpoint,
    };

    const signv4 = new ISigV4Credentials(
      this.opts.stsToken,
      this.opts.accessKeySecret,
      this.opts.accessKeyId
    );

    const sig = new SignersV4(
      {
        algorithm: 'TOS4-HMAC-SHA256',
        region: this.opts.region,
        serviceName: 'tos',
        bucket: '',
        securityToken: this.opts.stsToken,
      },
      signv4
    );

    const signatureHeaders = sig.signatureHeader(signOpt);
    const reqHeaders = { ...headers };

    const reqOpts: AxiosRequestConfig = {
      method,
      baseURL: `http${this.opts.secure ? 's' : ''}://${endpoint}`,
      url: path,
      params: query,
      headers: reqHeaders,
      data: body,
    };

    signatureHeaders.forEach((value, key) => {
      reqOpts.headers[key] = value;
    });

    const normalizedProxy = normalizeProxy(this.opts.proxy);
    if (normalizedProxy?.url) {
      reqOpts.baseURL = normalizedProxy.url;
      if (normalizedProxy?.needProxyParams) {
        reqOpts.params['x-proxy-tos-host'] = endpoint;
        delete reqHeaders['host'];
      }
    }

    if (process.env.TARGET_ENVIRONMENT === 'node') {
      reqHeaders['user-agent'] = this.userAgent;
    } else {
      // the browser xhr doesn't set the host and user-agent
      delete reqHeaders['host'];
    }

    reqOpts.timeout = this.opts.requestTimeout;

    if (process.env.TARGET_ENVIRONMENT === 'node') {
      reqOpts.httpAgent = this.httpAgent;
      reqOpts.httpsAgent = this.httpsAgent;
    }

    try {
      // console.log('axios: ', reqOpts.method, reqOpts.url, reqOpts.params);
      const res = await this.axiosInst({
        ...{ maxBodyLength: Infinity, maxContentLength: Infinity },
        ...reqOpts,
        ...(opts?.axiosOpts || {}),
      });
      const data = handleResponse(res);
      return {
        data,
        statusCode: res.status,
        headers: res.headers,
        requestId: res.headers['x-tos-request-id'],
        id2: res.headers['x-tos-id-2'],
      };
    } catch (err) {
      // console.log('err response: ', (err as any).response.data);
      if (axios.isAxiosError(err) && err.response?.data?.RequestId) {
        // it's ServerError only if `RequestId` exists
        const response: AxiosResponse<TosServerErrorData> = err.response;
        const err2 = new TosServerError(response);
        throw err2;
      }

      // it is neither ServerError nor ClientError, it's other error
      throw err;
    }
  }

  protected async fetchBucket<Data>(
    bucket: string | undefined,
    method: Method,
    query: any,
    headers: Headers,
    body?: Object | File | Blob | NodeJS.ReadableStream,
    opts?: FetchOpts<Data>
  ): Promise<TosResponse<Data>> {
    const actualBucket = bucket || this.opts.bucket;
    if (!actualBucket) {
      throw new TosClientError('Must provide bucket param');
    }
    return this.fetch(method, '/', query, headers, body, {
      ...opts,
      subdomainBucket: actualBucket,
    });
  }

  protected async fetchObject<Data>(
    input: { bucket?: string; key: string } | string,
    method: Method,
    query: any,
    headers: Headers,
    body?: Object | File | Blob | NodeJS.ReadableStream,
    opts?: FetchOpts<Data>
  ): Promise<TosResponse<Data>> {
    const actualBucket =
      (typeof input !== 'string' && input.bucket) || this.opts.bucket;
    const actualKey = typeof input === 'string' ? input : input.key;
    if (!actualBucket) {
      throw new TosClientError('Must provide bucket param');
    }
    validateObjectName(actualKey);

    return this.fetch(
      method,
      `/${encodeURIComponent(actualKey)}`,
      query,
      headers,
      body,
      {
        ...opts,
        subdomainBucket: actualBucket,
      }
    );
  }

  protected getSignatureQuery(
    input: GetSignatureQueryInput
  ): Record<string, string> {
    const signv4 = new ISigV4Credentials(
      this.opts.stsToken,
      this.opts.accessKeySecret,
      this.opts.accessKeyId
    );

    const sig = new SignersV4(
      {
        algorithm: 'TOS4-HMAC-SHA256',
        region: this.opts.endpoint,
        serviceName: 'tos',
        // SignV4 uses this.options.bucket, so set it here
        bucket: input.bucket,
        securityToken: this.opts.stsToken,
      },
      signv4
    );

    return sig.getSignatureQuery(
      {
        method: input.method,
        path: input.path,
        endpoints: input.subdomain ? this.opts.endpoint : undefined,
        host: this.opts.endpoint,
        query: input.query,
      },
      input.expires
    );
  }

  protected getObjectPath = (
    opts: { bucket?: string; key: string } | string
  ) => {
    const actualBucket =
      (typeof opts !== 'string' && opts.bucket) || this.opts.bucket;
    const actualKey = typeof opts === 'string' ? opts : opts.key;
    if (!actualBucket) {
      throw new TosClientError('Must provide bucket param');
    }
    return `/${actualBucket}/${encodeURIComponent(actualKey)}`;
  };

  protected normalizeBucketInput<T extends { bucket: string }>(
    input: T | string
  ): T {
    return (typeof input === 'string' ? { bucket: input } : input) as T;
  }
  protected normalizeObjectInput<T extends { key: string }>(
    input: T | string
  ): T {
    return (typeof input === 'string' ? { key: input } : input) as T;
  }

  protected setObjectContentTypeHeader = (
    input: string | { key: string },
    headers: Headers
  ): void => {
    if (headers['content-type'] != null) {
      return;
    }

    let mimeType = DEFAULT_CONTENT_TYPE;
    const key = getObjectInputKey(input);

    if (this.opts.autoRecognizeContentType) {
      mimeType = lookupMimeType(key) || mimeType;
    }

    if (mimeType) {
      headers['content-type'] = mimeType;
    }
  };
}

export default TOSBase;
