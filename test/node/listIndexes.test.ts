import { DataType, DistanceMetricType } from '../../src/TosExportEnum';
import { TosVectorsClient } from '../../src/TosVectorsClient';
import { NEVER_TIMEOUT,  } from '../utils';
import { testAccountId, tosVectorsOptions } from '../utils/options';
import { deleteVectorBucket } from './utils';

const client = new TosVectorsClient({
  accessKeyId: tosVectorsOptions.accessKeyId,
  accessKeySecret: tosVectorsOptions.accessKeySecret,
  region: tosVectorsOptions.region,
  endpoint: tosVectorsOptions.endpoint,
});

const testVectorBucketName = 'test-vector-bucket-' + Date.now();

describe('ListIndexes', () => {
  beforeAll(async () => {
    // 创建测试用的向量存储桶
    await client.createVectorBucket({
      vectorBucketName: testVectorBucketName,
    });

    // 创建几个测试索引用于列表测试
    const indexNames = [
      'test-index-1',
      'test-index-2',
      'prefix-index-1',
      'prefix-index-2',
    ];
    for (const indexName of indexNames) {
      await client.createIndex({
        vectorBucketName: testVectorBucketName,
        accountID: testAccountId,
        indexName: indexName,
        dataType: DataType.DataTypeFloat32,
        dimension: 128,
        distanceMetric: DistanceMetricType.DistanceMetricEuclidean,
      });
    }
  }, NEVER_TIMEOUT);

  afterAll(async () => {
    await deleteVectorBucket(client, testVectorBucketName, testAccountId);
  }, NEVER_TIMEOUT);

  it(
    'should list indexes successfully with basic parameters',
    async () => {
      const result = await client.listIndexes({
        vectorBucketName: testVectorBucketName,
        accountID: testAccountId,
      });

      expect(result).toBeDefined();
      expect(result.statusCode).toBe(200);
      expect(result.data).toBeDefined();
      expect(result.data.indexes).toBeDefined();
      expect(Array.isArray(result.data.indexes)).toBe(true);
      expect(result.requestId).toBeDefined();
      expect(result.headers).toBeDefined();

      // 验证返回的索引数据结构
      if (result.data.indexes.length > 0) {
        const index = result.data.indexes[0];
        expect(index).toHaveProperty('creationTime');
        expect(index).toHaveProperty('indexName');
        expect(index).toHaveProperty('indexTrn');
        expect(index).toHaveProperty('vectorBucketName');
        expect(typeof index.creationTime).toBe('number');
        expect(typeof index.indexName).toBe('string');
        expect(typeof index.indexTrn).toBe('string');
        expect(typeof index.vectorBucketName).toBe('string');
      }
    },
    NEVER_TIMEOUT
  );

  it(
    'should limit results with maxResults parameter',
    async () => {
      const result = await client.listIndexes({
        vectorBucketName: testVectorBucketName,
        accountID: testAccountId,
        maxResults: 2,
      });

      expect(result.statusCode).toBe(200);
      expect(result.data.indexes).toBeDefined();
      expect(result.data.indexes.length).toBeLessThanOrEqual(2);
    },
    NEVER_TIMEOUT
  );

  it(
    'should filter results with prefix parameter',
    async () => {
      const result = await client.listIndexes({
        vectorBucketName: testVectorBucketName,
        accountID: testAccountId,
        prefix: 'prefix-',
      });

      expect(result.statusCode).toBe(200);
      expect(result.data.indexes).toBeDefined();

      // 验证所有返回的索引名称都以指定前缀开头
      for (const index of result.data.indexes) {
        expect(index.indexName.startsWith('prefix-')).toBe(true);
      }
    },
    NEVER_TIMEOUT
  );

  it(
    'should paginate results with nextToken',
    async () => {
      // 先列举一次获取 nextToken
      const firstPage = await client.listIndexes({
        vectorBucketName: testVectorBucketName,
        accountID: testAccountId,
        maxResults: 2,
      });

      expect(firstPage.statusCode).toBe(200);
      expect(firstPage.data.indexes).toBeDefined();
      expect(firstPage.data.indexes.length).toBe(2);

      // 如果有 nextToken，继续列举下一页
      const secondPage = await client.listIndexes({
        vectorBucketName: testVectorBucketName,
        accountID: testAccountId,
        maxResults: 2,
        nextToken: firstPage.data.nextToken,
      });

      expect(secondPage.statusCode).toBe(200);
      expect(secondPage.data.indexes).toBeDefined();
      expect(secondPage.data.indexes.length).toBeLessThanOrEqual(2);
      // 验证第一页和第二页数据不重复
      const firstPageNames = firstPage.data.indexes.map(i => i.indexName);
      const secondPageNames = secondPage.data.indexes.map(i => i.indexName);
      const overlap = firstPageNames.filter(name => secondPageNames.includes(name));
      expect(overlap.length).toBe(0);
      
    },
    NEVER_TIMEOUT
  );
});
