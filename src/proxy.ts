import url from 'url';
import { createProxyMiddleware } from 'http-proxy-middleware';
import cloneDeep from 'lodash.clonedeep';

interface CreateTosProxyMiddlewareOpts {
  // destHost equals to /etc/hosts configuration
  destHost?: string | ((proxyParam: string) => string);
  /**
   * force change proxy request protocol.
   * usage:
   * 1. change localhost tos-sdk request http protocol to https protocol.
   * 2. TOS server force https protocol
   */
  protocol?: 'http' | 'https';
}

/**
 *
 * @param context is context of http-proxy-middleware. refer: https://github.com/chimurai/http-proxy-middleware
 * @param {CreateTosProxyMiddlewareOpts} opts
 */

export function createTosProxyMiddleware(
  context: string,
  opts?: CreateTosProxyMiddlewareOpts
) {
  const proxyParamKey = 'x-proxy-tos-host';
  return createProxyMiddleware(context, {
    secure: false,
    /**
     * 这里不开可能会导致 https 转发建联失败
     */
    changeOrigin: true,
    pathRewrite: (_path, req) => {
      const path = req.path;
      const query = cloneDeep(req.query) as any;
      delete query[proxyParamKey];

      const newPath = url.format({
        pathname: path.replace(context, ''),
        query,
      });
      return newPath;
    },
    router: function(req) {
      let originHost = req.query[proxyParamKey] as string;
      const realProtocol = opts?.protocol ?? req.protocol;

      if (!originHost) {
        throw Error(`代理缺少 ${proxyParamKey} 参数`);
      }

      if (opts?.destHost) {
        if (typeof opts.destHost === 'function') {
          originHost = opts.destHost(originHost);
        } else {
          originHost = opts.destHost;
        }
      }

      return `${realProtocol}://${originHost}`;
    },
  });
}
