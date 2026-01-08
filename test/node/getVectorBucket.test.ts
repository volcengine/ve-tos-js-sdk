import { TosVectorsClient } from '../../src/TosVectorsClient';
import { testAccountId, tosVectorsOptions } from '../utils/options';
import { TosServerError } from '../../src/TosServerError';
import { NEVER_TIMEOUT } from '../utils';
import { deleteVectorBucket } from './utils';

const client = new TosVectorsClient({
  accessKeyId: tosVectorsOptions.accessKeyId,
  accessKeySecret: tosVectorsOptions.accessKeySecret,
  region: tosVectorsOptions.region,
  endpoint: tosVectorsOptions.endpoint,
});

const testVectorBucketName = 'test-' + Date.now();

describe('getVectorBucket', () => {
  beforeAll(async () => {
    // 创建测试用的向量存储桶
    await client.createVectorBucket({
      vectorBucketName: testVectorBucketName,
    });
  });

  afterAll(async () => {
    // 清理测试用的向量存储桶
    await deleteVectorBucket(client, testVectorBucketName, testAccountId);
  });

  it(
    'should get vector bucket info successfully',
    async () => {
      const input = {
        vectorBucketName: testVectorBucketName,
        accountID: testAccountId,
      };

      const result = await client.getVectorBucket(input);

      expect(result.statusCode).toBe(200);
      expect(result.data).toBeDefined();
      expect(result.data.vectorBucket).toBeDefined();
      expect(result.data.vectorBucket.vectorBucketName).toBe(testVectorBucketName);
      expect(result.data.vectorBucket.creationTime).toBeDefined();
      expect(result.data.vectorBucket.vectorBucketTrn).toBeDefined();

      const deleteRes = await client.deleteVectorBucket(input);
      expect(deleteRes.statusCode).toBe(200);


      try {
        await client.getVectorBucket(input);
        fail('Should throw error');
      } catch (error) {
        if (!(error instanceof TosServerError)) throw error;
        expect(error.statusCode).toBe(404);
        expect(error.data?.Code).toBe('VectorBucketNotFound');
      }
    },
    NEVER_TIMEOUT
  );
});