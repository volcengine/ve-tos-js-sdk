import { DataType, DistanceMetricType } from '../../src/TosExportEnum';
import { TosVectorsClient } from '../../src/TosVectorsClient';
import { NEVER_TIMEOUT, sleepCache } from '../utils';
import { testAccountId, tosVectorsOptions } from '../utils/options';
import { deleteVectorBucket } from './utils';

const client = new TosVectorsClient({
  accessKeyId: tosVectorsOptions.accessKeyId,
  accessKeySecret: tosVectorsOptions.accessKeySecret,
  region: tosVectorsOptions.region,
  endpoint: tosVectorsOptions.endpoint,
});

const testVectorBucketName = 'test-vector-bucket-' + Date.now();
const testIndexName = 'test-index-' + Date.now();

describe('PutVectors', () => {
  beforeAll(async () => {
    // 创建测试用的向量存储桶和索引
    await client.createVectorBucket({
      vectorBucketName: testVectorBucketName,
    });
    await sleepCache();
    
    // 创建测试索引
    await client.createIndex({
      vectorBucketName: testVectorBucketName,
      accountID: testAccountId,
      indexName: testIndexName,
      dataType: DataType.DataTypeFloat32,
      dimension: 128,
      distanceMetric: DistanceMetricType.DistanceMetricEuclidean,
    });
    await sleepCache();
  }, NEVER_TIMEOUT);

  afterAll(async () => {
    await deleteVectorBucket(client, testVectorBucketName, testAccountId);
  }, NEVER_TIMEOUT);

  it(
    'should put vectors successfully with basic parameters',
    async () => {
      const vectors = [
        {
          key: 'vector-1-' + Date.now(),
          data: {
            float32: Array.from({ length: 128 }, () => Math.random()),
          },
        },
        {
          key: 'vector-2-' + Date.now(),
          data: {
            float32: Array.from({ length: 128 }, () => Math.random()),
          },
        },
      ];

      const result = await client.putVectors({
        vectorBucketName: testVectorBucketName,
        accountID: testAccountId,
        indexName: testIndexName,
        vectors,
      });

      expect(result).toBeDefined();
      expect(result.statusCode).toBe(200);
      expect(result.data).toBeDefined();
      expect(result.requestId).toBeDefined();
      expect(result.headers).toBeDefined();
    },
    NEVER_TIMEOUT
  );

  it(
    'should put vectors successfully with metadata',
    async () => {
      const vectors = [
        {
          key: 'vector-meta-1-' + Date.now(),
          data: {
            float32: Array.from({ length: 128 }, () => Math.random()),
          },
          metadata: {
            category: 'electronics',
            timestamp: Date.now(),
            source: 'user-upload',
          },
        },
        {
          key: 'vector-meta-2-' + Date.now(),
          data: {
            float32: Array.from({ length: 128 }, () => Math.random()),
          },
          metadata: {
            category: 'clothing',
            timestamp: Date.now(),
            source: 'batch-import',
          },
        },
      ];

      const result = await client.putVectors({
        vectorBucketName: testVectorBucketName,
        accountID: testAccountId,
        indexName: testIndexName,
        vectors,
      });

      expect(result.statusCode).toBe(200);
      expect(result.data).toBeDefined();
    },
    NEVER_TIMEOUT
  );

  it(
    'should handle batch vector insertion',
    async () => {
      const batchSize = 100;
      const vectors = Array.from({ length: batchSize }, (_, i) => ({
        key: `batch-vector-${i}-` + Date.now(),
        data: {
          float32: Array.from({ length: 128 }, () => Math.random()),
        },
        metadata: {
          batchId: 'batch-' + Date.now(),
          index: i,
        },
      }));

      const result = await client.putVectors({
        vectorBucketName: testVectorBucketName,
        accountID: testAccountId,
        indexName: testIndexName,
        vectors,
      });

      expect(result.statusCode).toBe(200);
      expect(result.data).toBeDefined();
    },
    NEVER_TIMEOUT
  );
});