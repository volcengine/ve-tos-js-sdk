import { DataType, DistanceMetricType } from '../../src/TosExportEnum';
import { TosVectorsClient } from '../../src/TosVectorsClient';
import { Vector } from '../../src/vectors-methods/vectors';
import { NEVER_TIMEOUT, sleepCache } from '../utils';
import { testAccountId, tosVectorsOptions } from '../utils/options';
import { deleteVectorBucket } from './utils';

const client = new TosVectorsClient(tosVectorsOptions);

describe('listVectors operations', () => {
  const testVectorBucketName = `test-vector-bucket-${Date.now()}`;
  const testIndexName = `test-index-${Date.now()}`;
  const testVectorsCount = 15;
  let testVectors: Vector[] = [];

  beforeAll(async () => {
    // 创建测试环境 - 单个桶和索引
    await client.createVectorBucket({ vectorBucketName: testVectorBucketName });

    // 创建测试索引
    await client.createIndex({
      vectorBucketName: testVectorBucketName,
      accountID: testAccountId,
      indexName: testIndexName,
      dataType: DataType.DataTypeFloat32,
      dimension: 128,
      distanceMetric: DistanceMetricType.DistanceMetricEuclidean,
    });

    // 批量创建测试向量（用于分页测试）
    testVectors = Array.from({ length: testVectorsCount }, (_, i) => ({
      key: `test-vector-${i.toString().padStart(3, '0')}-${Date.now()}`,
      data: {
        float32: Array.from({ length: 128 }, () => Math.random()),
      },
      metadata: {
        index: i,
        category: i % 2 === 0 ? 'electronics' : 'clothing',
        timestamp: Date.now(),
      },
    }));

    await client.putVectors({
      vectorBucketName: testVectorBucketName,
      accountID: testAccountId,
      indexName: testIndexName,
      vectors: testVectors,
    });

    // 等待所有向量写入完成
    await sleepCache(60 * 1000);
  }, NEVER_TIMEOUT);

  afterAll(async () => {
    // 清理测试环境
    await deleteVectorBucket(client, testVectorBucketName, testAccountId);
  }, NEVER_TIMEOUT);

  it(
    'should paginate vectors correctly',
    async () => {
      const pageSize = 5;

      // 第一页
      const page1 = await client.listVectors({
        vectorBucketName: testVectorBucketName,
        accountID: testAccountId,
        indexName: testIndexName,
        maxResults: pageSize,
        returnData: true,
        returnMetadata: true,
      });

      expect(page1.statusCode).toBe(200);
      expect(page1.data.vectors).toHaveLength(pageSize);
      expect(page1.data.nextToken).toBeDefined();

      // 第二页
      const page2 = await client.listVectors({
        vectorBucketName: testVectorBucketName,
        accountID: testAccountId,
        indexName: testIndexName,
        maxResults: pageSize,
        nextToken: page1.data.nextToken,
        returnData: true,
        returnMetadata: true,
      });

      expect(page2.statusCode).toBe(200);
      expect(page2.data.vectors).toHaveLength(pageSize);
      expect(page2.data.nextToken).toBeDefined();

      // 验证没有重复向量
      const page1Keys = page1.data.vectors.map((v) => v.key);
      const page2Keys = page2.data.vectors.map((v) => v.key);
      const duplicates = page1Keys.filter((key) => page2Keys.includes(key));
      expect(duplicates).toHaveLength(0);

      // 第三页（最后一页）
      const page3 = await client.listVectors({
        vectorBucketName: testVectorBucketName,
        accountID: testAccountId,
        indexName: testIndexName,
        maxResults: pageSize,
        nextToken: page2.data.nextToken,
        returnData: true,
        returnMetadata: true,
      });

      expect(page3.statusCode).toBe(200);
      expect(page3.data.vectors.length).toBeGreaterThanOrEqual(1);
      // 第三页可能没有nextToken，或者nextToken为空表示没有更多数据
    },
    NEVER_TIMEOUT
  );

  it(
    'should list vectors without optional parameters',
    async () => {
      const listRes = await client.listVectors({
        vectorBucketName: testVectorBucketName,
        accountID: testAccountId,
        indexName: testIndexName,
      });

      expect(listRes.statusCode).toBe(200);
      expect(listRes.data.vectors).toBeDefined();
      expect(listRes.data.vectors.length).toBeGreaterThanOrEqual(
        testVectorsCount
      );
    },
    NEVER_TIMEOUT
  );

  it(
    'should list vectors with returnData=false',
    async () => {
      const listRes = await client.listVectors({
        vectorBucketName: testVectorBucketName,
        accountID: testAccountId,
        indexName: testIndexName,
        returnData: false,
      });

      expect(listRes.statusCode).toBe(200);
      expect(listRes.data.vectors).toBeDefined();
      expect(listRes.data.vectors.length).toBeGreaterThanOrEqual(
        testVectorsCount
      );

      // 当returnData为false时，验证向量的data字段应该为空或未定义
      const testVector = listRes.data.vectors.find((v) =>
        v.key.includes('test-vector-000')
      ) as Vector;
      expect(testVector.data?.float32).toBeUndefined();
      expect(testVector.metadata).toBeUndefined();
    },
    NEVER_TIMEOUT
  );

  it(
    'should list vectors with returnMetadata=false',
    async () => {
      const listRes = await client.listVectors({
        vectorBucketName: testVectorBucketName,
        accountID: testAccountId,
        indexName: testIndexName,
        returnMetadata: false,
      });

      expect(listRes.statusCode).toBe(200);
      expect(listRes.data.vectors).toBeDefined();
      expect(listRes.data.vectors.length).toBeGreaterThanOrEqual(
        testVectorsCount
      );

      // 当returnMetadata为false时，验证向量的metadata字段应该为空或未定义
      const testVector = listRes.data.vectors.find((v) =>
        v.key.includes('test-vector-000')
      ) as Vector;
      expect(testVector.data?.float32).toBeUndefined();
      expect(testVector.metadata).toBeUndefined();
    },
    NEVER_TIMEOUT
  );

  it(
    'should list vectors with both returnData and returnMetadata true',
    async () => {
      const listRes = await client.listVectors({
        vectorBucketName: testVectorBucketName,
        accountID: testAccountId,
        indexName: testIndexName,
        returnData: true,
        returnMetadata: true,
      });

      expect(listRes.statusCode).toBe(200);
      expect(listRes.data.vectors).toBeDefined();
      expect(listRes.data.vectors.length).toBeGreaterThanOrEqual(
        testVectorsCount
      );

      // 验证数据和元数据都存在
      const testVector = listRes.data.vectors.find((v) =>
        v.key.includes('test-vector-000')
      );
      if (testVector) {
        expect(testVector.data?.float32).toBeDefined();
        expect(testVector.data?.float32?.length).toBe(128);
        expect(testVector.metadata).toBeDefined();
        expect(testVector.metadata?.category).toBe('electronics');
      }
    },
    NEVER_TIMEOUT
  );
});
