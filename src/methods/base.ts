import { hashMd5 } from '../universal/crypto';
import axios, { AxiosRequestConfig, AxiosResponse, Method } from 'axios';
import { ISigV4Credentials, SignersV4 } from '../signatureV4';
import { Headers } from '../interface';
import ResponseError, { ResponseErrorData } from '../responseError';
import { getEndpoint, getSortedQueryString, normalizeProxy } from '../utils';
import version from '../version';
import { TosAgent } from '../nodejs/TosAgent';

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
   * not implement
   * unit: ms
   * default value: 30s
   */
  socketTimeout?: number;

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
}

interface NormalizedTOSConstructorOptions extends TOSConstructorOptions {
  endpoint: string;
  enableVerifySSL: boolean;
  autoRecognizeContentType: boolean;
  socketTimeout: number;
  requestTimeout: number;
  connectionTimeout: number;
  maxConnections: number;
  idleConnectionTime: number;
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
   * If you has any question about the request, please send the requestId to TOS worker.
   */
  requestId: string;
}

export class TOSBase {
  opts: NormalizedTOSConstructorOptions;

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
  }

  private normalizeOpts(_opts: TOSConstructorOptions) {
    const mustKeys = ['accessKeyId', 'accessKeySecret', 'region'];
    const mustKeysErrorStr = mustKeys
      .filter(key => !(_opts as any)[key])
      .join(', ');

    if (mustKeysErrorStr) {
      throw new Error(`lack params: ${mustKeysErrorStr}.`);
    }

    const endpoint = _opts.endpoint || getEndpoint(_opts.region);
    if (!endpoint) {
      throw new Error(
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
      socketTimeout: _default(_opts.socketTimeout, 30_000),
      requestTimeout: _default(_opts.requestTimeout, 60_000),
      connectionTimeout: _default(_opts.connectionTimeout, 10_000),
      maxConnections: _default(_opts.maxConnections, 1024),
      idleConnectionTime: _default(_opts.idleConnectionTime, 60_000),
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
      headers['Content-MD5'] = md5String;
    }

    const endpoint = opts?.subdomainBucket
      ? `${opts?.subdomainBucket}.${this.opts.endpoint}`
      : this.opts.endpoint;

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
      const res = await axios({
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
      };
    } catch (err) {
      // console.log('err response: ', (err as any).response.data);
      if (axios.isAxiosError(err) && err.response) {
        const response: AxiosResponse<ResponseErrorData> = err.response;
        const err2 = new ResponseError(response);
        throw err2;
      }

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
      throw Error('Must provide bucket param');
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
      throw Error('Must provide bucket param');
    }
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
      throw Error('Must provide bucket param');
    }
    return `/${actualBucket}/${encodeURIComponent(actualKey)}`;
  };

  protected getNormalDataFromError<T>(
    data: T,
    err: ResponseError
  ): TosResponse<T> {
    return {
      data,
      statusCode: err.statusCode,
      headers: err.headers,
      requestId: err.requestId,
    };
  }

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
}

export default TOSBase;
