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

describe('GetVectors', () => {
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
    'should get vectors successfully',
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
      await sleepCache(60 * 1000);

      const getResult = await client.getVectors({
        vectorBucketName: testVectorBucketName,
        accountID: testAccountId,
        indexName: testIndexName,
        keys: vectors.map((v) => v.key),
      });

      expect(getResult.statusCode).toBe(200);
      expect(getResult.data).toBeDefined();
      expect(getResult.data.vectors).toBeDefined();

      const getResultWithDataAndMetadata = await client.getVectors({
        vectorBucketName: testVectorBucketName,
        accountID: testAccountId,
        indexName: testIndexName,
        keys: vectors.map((v) => v.key),
        returnData: true,
        returnMetadata: true,
      });

      expect(getResultWithDataAndMetadata.statusCode).toBe(200);
      expect(getResultWithDataAndMetadata.data).toBeDefined();
      expect(getResultWithDataAndMetadata.data.vectors).toHaveLength(2);
      expect(getResultWithDataAndMetadata.data.vectors[0].key).toBe(
        vectors[0].key
      );
      expect(
        getResultWithDataAndMetadata.data.vectors[0].data?.float32?.length
      ).toBe(128);
      expect(getResultWithDataAndMetadata.data.vectors[0].metadata).toEqual(
        vectors[0].metadata
      );

      const deleteResult = await client.deleteVectors({
        vectorBucketName: testVectorBucketName,
        accountID: testAccountId,
        indexName: testIndexName,
        keys: vectors.map((v) => v.key),
      });

      expect(deleteResult.statusCode).toBe(200);
      expect(deleteResult.data).toBeDefined();

      await sleepCache(60 * 1000);

      const res2 = await client.getVectors({
        vectorBucketName: testVectorBucketName,
        accountID: testAccountId,
        indexName: testIndexName,
        keys: vectors.map((v) => v.key),
      });
      expect(res2.statusCode).toBe(200);
      expect(res2.data).toBeDefined();
      expect(res2.data.vectors).toBeUndefined();
    },
    NEVER_TIMEOUT
  );
});
