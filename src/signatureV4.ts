// @ts-nocheck
import { hashSha256, hmacSha256, stringify, parse } from './universal/crypto';
import qs from 'querystring';
import { getSortedQueryString } from './utils';

export interface ISign {
  signature(
    opt: ISigOptions,
    expiredAt: number,
    credentials?: ISigCredentials
  ): string;
  signatureHeader(
    opt: ISigOptions,
    expiredAt?: number,
    credentials?: ISigCredentials
  ): Map<string, string>;
  gnrCopySig(
    opt: ISigOptions,
    credentials: ISigCredentials
  ): { key: string; value: string };
  getSignatureQuery(
    opt: ISigOptions,
    expiredAt: number
  ): { [key: string]: any };
  getSignature(
    reqOpts: ISigOptions,
    expiredAt: number
  ): { key: string; value: string };
}

export interface ISigCredentials {
  GetSecretKey(): string;
  GetAccessKey(): string;
}

export interface ISigPolicyQuery {
  policy: {
    conditions: (string[] | { bucket: string } | { key: string })[];
  };
}

export interface ISigOptions {
  sigName?: string;
  endpoints?: string;
  bucket?: string;
  headers?: { [key: string]: string | undefined };
  region?: string;
  serviceName?: string;
  algorithm?: string;
  path: string;
  method: string;
  query?: string;
  datetime?: string;
  host?: string;
  port?: number;
}

export interface ISigQueryOptions extends Omit<ISigOptions, 'query'> {
  query?: Record<string, any>;
}

export const SIG_QUERY = {
  algorithm: 'tos-algorithm',
  expiration: 'tos-expiration',
  signame: 'tos-signame',
  signature: 'tos-signature',

  v4_algorithm: 'X-Tos-Algorithm',
  v4_credential: 'X-Tos-Credential',
  v4_date: 'X-Tos-Date',
  v4_expires: 'X-Tos-Expires',
  v4_signedHeaders: 'X-Tos-SignedHeaders',
  v4_security_token: 'X-Tos-Security-Token',
  v4_signature: 'X-Tos-Signature',
  v4_content_sha: 'X-Tos-Content-Sha256',
  v4_policy: 'X-Tos-Policy',
};

export function isDefaultPort(port?: number) {
  if (port && port !== 80 && port !== 443) {
    return false;
  }
  return true;
}

/**
 * @api private
 */
const v4Identifier = 'request';

interface ISignV4Opt {
  algorithm?: string;
  region?: string;
  serviceName?: string;
  securityToken?: string;
  bucket: string;
}
/**
 * @api private
 */
export class SignersV4 implements ISign {
  private options: ISignV4Opt;
  private credentials: ISigCredentials;
  constructor(opt: ISignV4Opt, credentials: ISigCredentials) {
    this.options = opt;
    this.credentials = credentials;
  }

  /*
   * normal v4 signature
   * */
  public signature = (
    opt: ISigOptions,
    expiredAt: number,
    credentials?: ISigCredentials
  ) => {
    if (!credentials) {
      credentials = this.credentials;
    }
    const parts: string[] = [];
    const datatime = opt.datetime as string;
    const credString = this.credentialString(datatime);
    parts.push(
      this.options.algorithm +
        ' Credential=' +
        credentials.GetAccessKey() +
        '/' +
        credString
    );

    // console.log(this.algorithm + ' Credential=' +
    //   credentials.accessKeyId + '/' + credString)

    parts.push('SignedHeaders=' + this.signedHeaders(opt));
    parts.push('Signature=' + this.authorization(opt, credentials, 0));
    return parts.join(', ');
  };

  public signatureHeader = (
    opt: ISigOptions,
    expiredAt?: number,
    credentials?: ISigCredentials
  ): Map<string, string> => {
    // const datetime = (new Date(new Date().toUTCString())).Format("yyyyMMddTHHmmssZ")
    opt.datetime = this.getDateTime();
    const header = new Map<string, string>();
    /* istanbul ignore if */
    if (!opt.headers) {
      const h: { [key: string]: string } = {};
      opt.headers = h;
    }

    opt.headers.host = `${opt.host}`;
    /* istanbul ignore if */
    if (!isDefaultPort(opt.port)) {
      opt.headers.host += ':' + opt.port;
    }
    /* istanbul ignore if */
    if (opt.endpoints) {
      opt.headers.host = `${this.options.bucket}.${opt.endpoints}`;
    }

    header.set('host', opt.headers.host); // opt.endpoints as string)
    header.set('x-tos-date', opt.datetime); // opt.datetime)
    /* istanbul ignore if
      if (opt.endpoints) {
          let bucket = this.options.bucket;
          if (opt.bucket) {
              bucket = opt.bucket;
          }
          if (!opt.path || opt.path === '/' || opt.path === `/${bucket}`) {
              opt.path = '/' + bucket;
          } else {
              opt.path = '/' + bucket + opt.path;
          }
      }
      */
    header.set('x-tos-content-sha256', this.hexEncodedBodyHash());
    if (this.options.securityToken) {
      header.set('x-tos-security-token', this.options.securityToken);
    }
    // x-tos- must to be signatured
    header.forEach((value, key) => {
      if (key.startsWith('x-tos')) {
        opt.headers[key] = value;
      }
    });
    opt.path = this.getEncodePath(opt.path);
    const sign = this.signature(opt, 0, credentials);
    header.set('authorization', sign);

    return header;
  };

  public gnrCopySig = (
    opt: ISigOptions,
    credentials: ISigCredentials
  ): { key: string; value: string } => {
    return { key: '', value: '' };
  };

  public getSignature = (
    opt: ISigOptions,
    expiredAt: number
  ): { key: ''; value: '' } => {
    return { key: '', value: '' };
  };

  public getSignatureQuery = (
    opt: ISigQueryOptions,
    expiredAt: number
  ): { [key: string]: any } => {
    opt.datetime = this.getDateTime();
    if (!opt.headers) {
      const h: { [key: string]: string } = {};
      opt.headers = h;
    }

    opt.headers.host = `${opt.host}`;
    if (!isDefaultPort(opt.port)) {
      opt.headers.host += ':' + opt.port;
    }

    opt.path = this.getEncodePath(opt.path);
    if (opt.endpoints) {
      opt.headers.host = `${this.options.bucket}.${opt.endpoints}`;
      // opt.path = `${opt.path}`;
    }

    opt.headers[SIG_QUERY.v4_date] = opt.datetime;
    const credString = this.credentialString(opt.datetime as string);
    const res = {
      ...(opt.query || {}),
      [SIG_QUERY.v4_algorithm]: this.options.algorithm,
      [SIG_QUERY.v4_content_sha]: this.hexEncodedBodyHash(),
      [SIG_QUERY.v4_credential]:
        this.credentials.GetAccessKey() + '/' + credString,
      [SIG_QUERY.v4_date]: opt.datetime,
      [SIG_QUERY.v4_expires]: '' + expiredAt,
      [SIG_QUERY.v4_signedHeaders]: this.signedHeaders(opt),
    };
    if (this.options.securityToken) {
      res[SIG_QUERY.v4_security_token] = this.options.securityToken;
    }
    opt.query = getSortedQueryString(res);

    res[SIG_QUERY.v4_signature] = this.authorization(
      opt,
      this.credentials,
      expiredAt
    );
    return res;
  };

  public getSignaturePolicyQuery = (
    opt: ISigPolicyQuery,
    expiredAt: number
  ): { [key: string]: any } => {
    opt.datetime = this.getDateTime();

    const credString = this.credentialString(opt.datetime as string);
    const res = {
      [SIG_QUERY.v4_algorithm]: this.options.algorithm,
      [SIG_QUERY.v4_credential]:
        this.credentials.GetAccessKey() + '/' + credString,
      [SIG_QUERY.v4_date]: opt.datetime,
      [SIG_QUERY.v4_expires]: '' + expiredAt,
      [SIG_QUERY.v4_policy]: stringify(
        parse(JSON.stringify(opt.policy), 'utf-8'),
        'base64'
      ),
    };
    if (this.options.securityToken) {
      res[SIG_QUERY.v4_security_token] = this.options.securityToken;
    }
    opt.query = getSortedQueryString(res);

    res[SIG_QUERY.v4_signature] = this.authorization(
      opt,
      this.credentials,
      expiredAt
    );
    return res;
  };

  private hexEncodedBodyHash = () => {
    return 'UNSIGNED-PAYLOAD';
    // return this.hexEncodedHash('');
  };

  private authorization = (
    opt: ISigOptions,
    credentials: ISigCredentials,
    expiredAt: number
  ) => {
    /* istanbul ignore if */
    if (!opt.datetime) {
      return '';
    }

    const signingKey = this.getSigningKey(
      credentials,
      opt.datetime.substr(0, 8)
    );
    // console.log(
    // 'signingKey:',
    //  signingKey,
    //  'sign:',
    //  this.stringToSign(opt.datetime, opt)
    //  );
    return hmacSha256(signingKey, this.stringToSign(opt.datetime, opt), 'hex');
  };

  private getDateTime = () => {
    const date = new Date(new Date().toUTCString());
    const datetime =
      date
        .toISOString()
        .replace(/\..+/, '')
        .replace(/-/g, '')
        .replace(/:/g, '') + 'Z';
    return datetime;
  };
  private credentialString = (datetime: string) => {
    return this.createScope(
      datetime.substr(0, 8),
      this.options.region,
      this.options.serviceName
    );
  };

  private createScope = (date, region, serviceName) => {
    return [date.substr(0, 8), region, serviceName, v4Identifier].join('/');
  };

  private getSigningKey = (credentials: ISigCredentials, date) => {
    const kDate = hmacSha256(credentials.GetSecretKey(), date);
    const kRegion = hmacSha256(kDate, this.options.region as string);
    const kService = hmacSha256(kRegion, this.options.serviceName as string);
    const signingKey = hmacSha256(kService, v4Identifier);

    return signingKey;
  };

  private stringToSign = (datetime: string, opt: ISigOptions) => {
    /* istanbul ignore if */
    if (!this.options.algorithm) {
      return '';
    }

    const parts: string[] = [];
    parts.push(this.options.algorithm);
    parts.push(datetime);
    parts.push(this.credentialString(datetime));
    const canonicalString =
      'policy' in opt
        ? this.canonicalStringPolicy(opt)
        : this.canonicalString(opt);
    // console.log('canonicalString',this.canonicalString(opt),' code:',this.hexEncodedHash(this.canonicalString(opt)));
    parts.push(this.hexEncodedHash(canonicalString));
    return parts.join('\n');
  };

  private hexEncodedHash = string => {
    return hashSha256(string, 'hex');
  };

  private canonicalString = (opt: ISigOptions) => {
    const parts: any[] = [];
    parts.push(opt.method);
    parts.push(opt.path);
    parts.push(this.getEncodePath(opt.query as string, false));
    parts.push(this.canonicalHeaders(opt) + '\n');
    parts.push(this.signedHeaders(opt));
    parts.push(this.hexEncodedBodyHash());
    return parts.join('\n');
  };

  private canonicalStringPolicy = (opt: ISigOptions) => {
    const parts: any[] = [];
    parts.push(this.getEncodePath(opt.query as string, false));
    parts.push(this.hexEncodedBodyHash());
    return parts.join('\n');
  };

  private canonicalHeaders = (opt: ISigOptions) => {
    const parts: string[] = [];
    const needSignHeaders = getNeedSignedHeaders(opt.headers);

    for (let key of needSignHeaders) {
      const value = opt.headers[key];
      key = key.toLowerCase();
      parts.push(key + ':' + this.canonicalHeaderValues(value.toString()));
    }

    return parts.join('\n');
  };

  private canonicalHeaderValues = (values: string) => {
    return values.replace(/\s+/g, ' ').replace(/^\s+|\s+$/g, '');
  };

  private signedHeaders = (opt: ISigOptions) => {
    const keys: string[] = [];
    const needSignHeaders = getNeedSignedHeaders(opt.headers);

    for (let key of needSignHeaders) {
      key = key.toLowerCase();
      keys.push(key);
    }

    return keys.sort().join(';');
  };

  /**
   * ! * ' () aren't transformed by encodeUrl, so they need be handled
   */
  private getEncodePath(path: string, encodeAll: boolean = true): string {
    if (!path) {
      return '';
    }

    let tmpPath = path;
    if (encodeAll) {
      tmpPath = path.replace(/%2F/g, '/');
    }
    tmpPath = tmpPath.replace(/\(/g, '%28');
    tmpPath = tmpPath.replace(/\)/g, '%29');
    tmpPath = tmpPath.replace(/!/g, '%21');
    tmpPath = tmpPath.replace(/\*/g, '%2A');
    tmpPath = tmpPath.replace(/\'/g, '%27');
    return tmpPath;
  }
}

export class ISigV4Credentials implements ISigCredentials {
  public securityToken: string;
  public secretAccessKey: string;
  public accessKeyId: string;

  constructor(
    securityToken?: string,
    secretAccessKey?: string,
    accessKeyId?: string
  ) {
    this.accessKeyId = accessKeyId as string;
    this.secretAccessKey = secretAccessKey as string;
    this.securityToken = securityToken as string;
  }

  public GetAccessKey(): string {
    return this.accessKeyId;
  }

  public GetSecretKey(): string {
    return this.secretAccessKey;
  }
}

function getNeedSignedHeaders(headers: Record<string, unknown> | undefined) {
  const needSignHeaders: string[] = [];
  Object.keys(headers || {}).forEach((key: string) => {
    if (key === 'host' || key.startsWith('x-tos-')) {
      if (headers[key] != null) {
        needSignHeaders.push(key);
      }
    }
  });
  return needSignHeaders.sort();
}
