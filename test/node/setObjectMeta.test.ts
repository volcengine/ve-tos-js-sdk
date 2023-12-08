import { TosClient } from '../../src';
import { NEVER_TIMEOUT } from '../utils';
import { tosOptions } from '../utils/options';

describe('setObjectMeta', () => {
  it(
    'set and get',
    async () => {
      const client = new TosClient(tosOptions);
      const key = 'setObjectMeta-set-and-get';
      await client.putObject(key);
      await client.setObjectMeta({
        key,
        // 用户自定义元数据信息
        meta: {
          key: 'value',
        },
        // 设置对象类型
        contentType: 'text/html',
        // 设置对象下载时内容语言格式
        contentLanguage: 'zh-cn',
        // 设置缓存策略
        cacheControl: 'no-store',
        // 设置缓存过期时间
        expires: new Date('2028/01/01'),
        // 设置下载内容下载时的名称
        contentDisposition: 'example.png',
        // 设置下载时编码类型
        contentEncoding: 'deflate',
      });
      const { headers } = await client.headObject(key);
      expect(headers['x-tos-meta-key']).toBe('value');
      expect(headers['content-type']).toBe('text/html');
      expect(headers['content-language']).toBe('zh-cn');
      expect(headers['cache-control']).toBe('no-store');
      expect(headers['expires']).toBe(new Date('2028/01/01').toUTCString());
      expect(headers['content-disposition']).toBe('example.png');
      expect(headers['content-encoding']).toBe('deflate');
    },
    NEVER_TIMEOUT
  );
});
