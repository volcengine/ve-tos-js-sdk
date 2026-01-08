import { TosVectorsClient } from '../../src/TosVectorsClient';
import { testAccountId, tosVectorsOptions } from '../utils/options';
import { NEVER_TIMEOUT } from '../utils';
import { TosServerError } from '../../src/TosServerError';

describe('putVectorBucketPolicy', () => {
  let vectorsClient: TosVectorsClient;
  const testVectorBucketName = `test-vector-bucket-${Date.now()}`;

  beforeAll(async () => {
    vectorsClient = new TosVectorsClient(tosVectorsOptions);

    // 创建测试向量存储桶
    const res = await vectorsClient.createVectorBucket({
      vectorBucketName: testVectorBucketName,
    });
    console.log('Created vector bucket:', res.statusCode);
  }, NEVER_TIMEOUT);

  afterAll(async () => {
    // 清理测试向量存储桶
    try {
      await vectorsClient.deleteVectorBucket({
        vectorBucketName: testVectorBucketName,
        accountID: testAccountId,
      });
    } catch (error) {
      // 忽略清理错误
      console.log('Cleanup error:', error);
    }
  }, NEVER_TIMEOUT);

  // P0: 基本功能测试
  it(
    'should set simple vector bucket policy successfully',
    async () => {
      const simplePolicy = JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: [testAccountId],
            Action: 'tosvectors:GetVectorBucket',
            Resource: `trn:tosvectors:cn-guilin-boe:${testAccountId}:bucket/${testVectorBucketName}`,
          },
        ],
      });

      const result = await vectorsClient.putVectorBucketPolicy({
        vectorBucketName: testVectorBucketName,
        accountID: testAccountId,
        policy: simplePolicy,
      });

      expect(result.statusCode).toBe(200);
      expect(result.data).toBeDefined();

      const getResult = await vectorsClient.getVectorBucketPolicy({
        vectorBucketName: testVectorBucketName,
        accountId: testAccountId,
      });

      expect(getResult.statusCode).toBe(200);
      expect(getResult.data).toBeDefined();
      expect(getResult.data.Statement).toBeDefined();
      expect(getResult.data.Statement.length).toBe(1);
      const statement = getResult.data.Statement[0];
      expect(statement.Effect).toBe('Allow');
      expect(statement.Principal).toContain(testAccountId);
      expect(statement.Resource).toBe(
        `trn:tosvectors:cn-guilin-boe:${testAccountId}:bucket/${testVectorBucketName}`
      );

      await vectorsClient.deleteVectorBucketPolicy({
        vectorBucketName: testVectorBucketName,
        accountID: testAccountId,
      });

      try {
        await vectorsClient.getVectorBucketPolicy({
          vectorBucketName: testVectorBucketName,
          accountId: testAccountId,
        });
        fail('Should throw error for deleted policy');
      } catch (error) {
        expect(error).toBeDefined();
        if (error instanceof TosServerError) {
          expect(error.statusCode).toBe(404);
        }
      }
    },
    NEVER_TIMEOUT
  );

  it(
    'should handle invalid JSON policy format',
    async () => {
      const invalidJsonPolicy = 'invalid json string {';

      try {
        await vectorsClient.putVectorBucketPolicy({
          vectorBucketName: testVectorBucketName,
          accountID: testAccountId,
          policy: invalidJsonPolicy,
        });
        fail('Should throw error for invalid JSON policy');
      } catch (error) {
        expect(error).toBeDefined();
        if (error instanceof TosServerError) {
          expect(error.statusCode).toBe(400);
        }
      }
    },
    NEVER_TIMEOUT
  );
});
