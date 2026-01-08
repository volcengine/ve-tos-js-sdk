import { TosVectorsClient } from '../../src/TosVectorsClient';
import { deleteVectorBucket } from './utils';
import { sleepCache, NEVER_TIMEOUT } from '../utils/';
import { testAccountId, tosVectorsOptions } from '../utils/options';
import { DataType, DistanceMetricType } from '../../src';

const client = new TosVectorsClient(tosVectorsOptions);

const testVectorBucketName = 'test-' + Date.now();
const testIndexName = 'test-query-vectors-index';
const accountId = testAccountId;

describe('QueryVectors', () => {
  beforeAll(async () => {
    // 创建测试用的向量存储桶和索引
    await client.createVectorBucket({
      vectorBucketName: testVectorBucketName,
    });

    // 等待存储桶创建完成
    await sleepCache(3);

    // 创建HNSW索引用于向量查询
    await client.createIndex({
      vectorBucketName: testVectorBucketName,
      accountID: accountId,
      indexName: testIndexName,
      dimension: 128,
      dataType: DataType.DataTypeFloat32,
      distanceMetric: DistanceMetricType.DistanceMetricCosine,
    });

    // 等待索引创建完成
    await sleepCache(5);

    // 准备测试向量数据
    const testVectors = Array.from({ length: 10 }, (_, i) => ({
      key: `test-vector-${i}`,
      data: {
        float32: Array.from({ length: 128 }, () => Math.random()),
      },
      metadata: {
        category: i % 2 === 0 ? 'A' : 'B',
        timestamp: Date.now() - i * 1000,
        index: i,
      },
    }));

    // 上传测试向量
    await client.putVectors({
      vectorBucketName: testVectorBucketName,
      accountID: accountId,
      indexName: testIndexName,
      vectors: testVectors,
    });

    // 等待向量上传完成
    await sleepCache(60 * 1000);
  }, NEVER_TIMEOUT);

  afterAll(async () => {
    deleteVectorBucket(client, testVectorBucketName, accountId);
  }, NEVER_TIMEOUT);

  it('should query vectors successfully with basic parameters', async () => {
    const queryVector = Array.from({ length: 128 }, () => Math.random());

    const result = await client.queryVectors({
      vectorBucketName: testVectorBucketName,
      accountID: accountId,
      indexName: testIndexName,
      returnDistance: true,
      returnMetadata: true,
      topK: 5,
      queryVector: {
        float32: queryVector,
      },
    });

    expect(result.statusCode).toBe(200);
    expect(result.data).toBeDefined();
    expect(result.data.vectors).toBeDefined();
    expect(Array.isArray(result.data.vectors)).toBe(true);
    expect(result.data.vectors.length).toBeLessThanOrEqual(5);

    // 验证返回的向量结构
    if (result.data.vectors.length > 0) {
      const vector = result.data.vectors[0];
      expect(vector).toHaveProperty('key');
      expect(vector).toHaveProperty('data');
      expect(vector).toHaveProperty('distance');
      expect(vector).toHaveProperty('metadata');
      expect(typeof vector.key).toBe('string');
      expect(typeof vector.distance).toBe('number');
    }
  });

  it('should query vectors with filter condition', async () => {
    const queryVector = Array.from({ length: 128 }, () => Math.random());

    const result = await client.queryVectors({
      vectorBucketName: testVectorBucketName,
      accountID: accountId,
      indexName: testIndexName,
      returnDistance: true,
      returnMetadata: true,
      topK: 10,
      queryVector: {
        float32: queryVector,
      },
      filter: {
        category: 'A',
      },
    });

    expect(result.statusCode).toBe(200);
    expect(result.data.vectors).toBeDefined();

    // 验证过滤后的结果
    result.data.vectors.forEach((vector) => {
      expect(vector.metadata.category).toBe('A');
    });
  });

  it('should query vectors without returning distance', async () => {
    const queryVector = Array.from({ length: 128 }, () => Math.random());

    const result = await client.queryVectors({
      vectorBucketName: testVectorBucketName,
      accountID: accountId,
      indexName: testIndexName,
      returnDistance: false,
      returnMetadata: true,
      topK: 3,
      queryVector: {
        float32: queryVector,
      },
      filter: {},
    });

    expect(result.statusCode).toBe(200);
    expect(result.data.vectors).toBeDefined();

    const vector = result.data.vectors[0];
    expect(vector).toHaveProperty('key');
    expect(vector).toHaveProperty('data');
    expect(vector).toHaveProperty('metadata');
    // distance字段应该存在，但值可能为0或null
    expect(vector.distance).toBeUndefined();
  });

  it('should query vectors without returning metadata', async () => {
    const queryVector = Array.from({ length: 128 }, () => Math.random());

    const result = await client.queryVectors({
      vectorBucketName: testVectorBucketName,
      accountID: accountId,
      indexName: testIndexName,
      returnDistance: true,
      returnMetadata: false,
      topK: 3,
      queryVector: {
        float32: queryVector,
      },
      filter: {},
    });

    expect(result.statusCode).toBe(200);
    expect(result.data.vectors).toBeDefined();

    // 验证不返回元数据时，metadata字段是否存在
    const vector = result.data.vectors[0];
    expect(vector).toHaveProperty('key');
    expect(vector).toHaveProperty('data');
    expect(vector).toHaveProperty('distance');
    // metadata字段应该存在，但可能为空对象
    expect(vector.metadata).toBeUndefined();
  });

  it('should handle query with different topK values', async () => {
    const queryVector = Array.from({ length: 128 }, () => Math.random());

    // 测试不同的topK值
    const topKValues = [1, 3, 5, 10];

    for (const topK of topKValues) {
      const result = await client.queryVectors({
        vectorBucketName: testVectorBucketName,
        accountID: accountId,
        indexName: testIndexName,
        returnDistance: true,
        returnMetadata: true,
        topK,
        queryVector: {
          float32: queryVector,
        },
        filter: {},
      });

      expect(result.statusCode).toBe(200);
      expect(result.data.vectors.length).toBeLessThanOrEqual(topK);
    }
  });

  it('should handle empty query results', async () => {
    const queryVector = Array.from({ length: 128 }, () => Math.random());

    const result = await client.queryVectors({
      vectorBucketName: testVectorBucketName,
      accountID: accountId,
      indexName: testIndexName,
      returnDistance: true,
      returnMetadata: true,
      topK: 5,
      queryVector: {
        float32: queryVector,
      },
      filter: {
        category: 'NonExistentCategory',
      },
    });

    expect(result.statusCode).toBe(200);
    expect(result.data.vectors).toBeUndefined();
  });
});
