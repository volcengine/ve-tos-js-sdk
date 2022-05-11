import url from 'url';
import { createProxyMiddleware } from 'http-proxy-middleware';
import cloneDeep from 'lodash/cloneDeep';

interface CreateTosProxyMiddlewareOpts {
  // destHost equals to /etc/hosts configuration
  destHost?: string | ((proxyParam: string) => string);
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
    onProxyReq: (proxyReq, req, _res) => {
      const urlObj = url.parse((req as any).originalUrl, true);
      proxyReq.setHeader('host', urlObj.query[proxyParamKey] as string);
    },
    router: function (req) {
      let originHost = req.query[proxyParamKey] as string;

      if (!originHost) {
        throw Error(`proxy misses ${proxyParamKey} param`);
      }

      if (opts?.destHost) {
        if (typeof opts.destHost === 'function') {
          originHost = opts.destHost(originHost);
        } else {
          originHost = opts.destHost;
        }
      }

      return `http://${originHost}`;
    },
  });
}
