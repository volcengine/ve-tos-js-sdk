import TosClientError from '../../TosClientError';
import { covertCamelCase2Kebab, normalizeProxy } from '../../utils';
import TOSBase from '../base';
import { validateObjectName } from './utils';

export interface GetPreSignedUrlInput {
  bucket?: string;
  key: string;
  /**
   * default: 'GET'
   */
  method?: 'GET' | 'PUT';
  /**
   * unit: second, default: 1800
   */
  expires?: number;
  alternativeEndpoint?: string;
  response?: {
    contentType?: string;
    contentDisposition?: string;
  };
  versionId?: string;
  query?: Record<string, string>;
  /**
   * default: false
   * if set true. generate domain will direct use `endpoint` or `alternativeEndpoint`.
   */
  isCustomDomain?: boolean;
}

export function getPreSignedUrl(
  this: TOSBase,
  input: GetPreSignedUrlInput | string
) {
  validateObjectName(input);
  const normalizedInput = typeof input === 'string' ? { key: input } : input;
  const endpoint = normalizedInput.alternativeEndpoint || this.opts.endpoint;
  const subdomain =
    normalizedInput.alternativeEndpoint || normalizedInput.isCustomDomain
      ? false
      : true;
  const bucket = normalizedInput.bucket || this.opts.bucket || '';
  if (subdomain && !bucket) {
    throw new TosClientError('Must provide bucket param');
  }

  const [newHost, newPath, signingPath] = (() => {
    const encodedKey = encodeURIComponent(normalizedInput.key);
    const objectKeyPath = normalizedInput.key
      .split('/')
      .map((it) => encodeURIComponent(it))
      .join('/');

    if (subdomain) {
      return [`${bucket}.${endpoint}`, `/${objectKeyPath}`, `/${encodedKey}`];
    }
    return [endpoint, `/${objectKeyPath}`, `/${encodedKey}`];
  })();

  const nextQuery: Record<string, any> = normalizedInput.query || {};
  const setOneQuery = (k: string, v?: string) => {
    if (nextQuery[k] == null && v != null) {
      nextQuery[k] = v;
    }
  };
  const response = normalizedInput.response || {};
  Object.keys(response).forEach((_key) => {
    const key = _key as keyof typeof response;
    const kebabKey = covertCamelCase2Kebab(key);
    setOneQuery(`response-${kebabKey}`, response[key]);
  });
  if (normalizedInput.versionId) {
    setOneQuery('versionId', normalizedInput.versionId);
  }

  const query = this.getSignatureQuery({
    bucket,
    method: normalizedInput.method || 'GET',
    path: signingPath,
    endpoint,
    subdomain,
    expires: normalizedInput.expires || 1800,
    query: nextQuery,
  });

  const normalizedProxy = normalizeProxy(this.opts.proxy);
  let baseURL = `http${this.opts.secure ? 's' : ''}://${newHost}`;
  if (normalizedProxy?.url) {
    // if `baseURL` ends with '/'，we filter it.
    // because `newPath` starts with '/'
    baseURL = normalizedProxy.url.replace(/\/+$/g, '');
    if (normalizedProxy?.needProxyParams) {
      query['x-proxy-tos-host'] = newHost;
    }
  }

  const queryStr = Object.keys(query)
    .map((key) => {
      return `${encodeURIComponent(key)}=${encodeURIComponent(query[key])}`;
    })
    .join('&');

  return `${baseURL}${newPath}?${queryStr}`;
}

export default getPreSignedUrl;
