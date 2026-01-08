import { TosVectorsClient } from '../../src/TosVectorsClient';
import { testAccountId, tosVectorsOptions } from '../utils/options';

const client = new TosVectorsClient(tosVectorsOptions);

const NEVER_TIMEOUT = 1000 * 60 * 5;

describe('listVectorBuckets', () => {
  // P0: 基本功能测试 - 列举向量存储桶
  it(
    'should list vector buckets successfully',
    async () => {
      const vectorBucketName = `test-list-bucket-${Date.now()}`;
      
      // 先创建一个测试存储桶
      const createResult = await client.createVectorBucket({
        vectorBucketName,
      });
      expect(createResult.statusCode).toBe(200);

      // 测试列举功能
      const result = await client.listVectorBuckets({});
      
      expect(result).toBeDefined();
      expect(result.statusCode).toBe(200);
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data.vectorBuckets)).toBe(true);
      
      // 验证返回的存储桶列表中包含刚创建的存储桶
      const foundBucket = result.data.vectorBuckets?.find(
        (bucket) => bucket.vectorBucketName === vectorBucketName
      );
      expect(foundBucket).toBeDefined();
      expect(foundBucket?.vectorBucketName).toBe(vectorBucketName);
      expect(foundBucket?.vectorBucketTrn).toBeDefined();
      expect(foundBucket?.creationTime).toBeDefined();

      // 清理测试数据
      const deleteRes = await client.deleteVectorBucket({
        vectorBucketName,
        accountID: testAccountId,
      });
      expect(deleteRes.statusCode).toBe(200);
    },
    NEVER_TIMEOUT
  );

  // P0: 分页功能测试
  it(
    'should support pagination with maxResults and nextToken',
    async () => {
      // 创建多个测试存储桶
      const bucketNames = [];
      for (let i = 0; i < 3; i++) {
        const bucketName = `page-bucket-${Date.now()}-${i}`;
        bucketNames.push(bucketName);
        
        const createResult = await client.createVectorBucket({
          vectorBucketName: bucketName,
        });
        expect(createResult.statusCode).toBe(200);
      }

      // 第一页，限制返回数量
      const page1 = await client.listVectorBuckets({
        maxResults: 2,
      });
      
      expect(page1.statusCode).toBe(200);
      expect(page1.data.vectorBuckets).toBeDefined();
      expect(page1.data.vectorBuckets?.length).toBeLessThanOrEqual(2);

      // 如果有下一页，测试nextToken
      if (page1.data.nextToken) {
        const page2 = await client.listVectorBuckets({
          maxResults: 2,
          nextToken: page1.data.nextToken,
        });
        
        expect(page2.statusCode).toBe(200);
        expect(page2.data.vectorBuckets).toBeDefined();
      }

      // 清理测试数据
      for (const bucketName of bucketNames) {
        const deleteRes = await client.deleteVectorBucket({
          vectorBucketName: bucketName,
          accountID: testAccountId,
        });
        expect(deleteRes.statusCode).toBe(200);
      }
    },
    NEVER_TIMEOUT
  );

  // P0: 前缀过滤功能测试
  it(
    'should filter vector buckets by prefix',
    async () => {
      const prefix = `test-prefix-${Date.now()}`;
      const bucketName1 = `${prefix}-1`;
      const bucketName2 = `${prefix}-2`;
      const otherBucketName = `other-${Date.now()}`;

      // 创建测试存储桶
      await client.createVectorBucket({ vectorBucketName: bucketName1 });
      await client.createVectorBucket({ vectorBucketName: bucketName2 });
      await client.createVectorBucket({ vectorBucketName: otherBucketName });

      // 使用前缀过滤
      const result = await client.listVectorBuckets({
        prefix: prefix,
      });

      expect(result.statusCode).toBe(200);
      expect(result.data.vectorBuckets).toBeDefined();
      
      // 验证只返回了匹配前缀的存储桶
      const filteredBuckets = result.data.vectorBuckets || [];
      expect(filteredBuckets.length).toBeGreaterThanOrEqual(2);
      
      filteredBuckets.forEach((bucket) => {
        expect(bucket.vectorBucketName).toMatch(new RegExp(`^${prefix}`));
      });

      // 验证包含预期的存储桶
      const foundBucket1 = filteredBuckets.find(
        (bucket) => bucket.vectorBucketName === bucketName1
      );
      const foundBucket2 = filteredBuckets.find(
        (bucket) => bucket.vectorBucketName === bucketName2
      );
      expect(foundBucket1).toBeDefined();
      expect(foundBucket2).toBeDefined();

      // 清理测试数据
      await client.deleteVectorBucket({ vectorBucketName: bucketName1, accountID: testAccountId });
      await client.deleteVectorBucket({ vectorBucketName: bucketName2, accountID: testAccountId });
      await client.deleteVectorBucket({ vectorBucketName: otherBucketName, accountID: testAccountId });
    },
    NEVER_TIMEOUT
  );

  // P2: 空结果测试
  it(
    'should handle empty result with non-existing prefix',
    async () => {
      const result = await client.listVectorBuckets({
        prefix: `non-existing-prefix-${Date.now()}`,
      });

      expect(result.statusCode).toBe(200);
      expect(result.data.vectorBuckets?.length || 0).toBe(0);
      expect(result.data.nextToken).toBeUndefined();
    },
    NEVER_TIMEOUT
  );
});