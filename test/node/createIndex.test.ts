import { TosServerError } from '../../src';
import { DataType, DistanceMetricType } from '../../src/TosExportEnum';
import { TosVectorsClient } from '../../src/TosVectorsClient';
import { safeAwait } from '../../src/utils';
import { NEVER_TIMEOUT, sleepCache } from '../utils';
import { testAccountId, tosVectorsOptions } from '../utils/options';
import { deleteVectorBucket } from './utils';

const client = new TosVectorsClient({
  accessKeyId: tosVectorsOptions.accessKeyId,
  accessKeySecret: tosVectorsOptions.accessKeySecret,
  region: tosVectorsOptions.region,
  endpoint: tosVectorsOptions.endpoint,
});

const testVectorBucketName = 'js-sdk-' + Date.now();

describe('CreateIndex', () => {
  beforeAll(async () => {
    // 创建测试用的向量存储桶
    await client.createVectorBucket({
      vectorBucketName: testVectorBucketName,
    });
    await sleepCache();
  }, NEVER_TIMEOUT);

  afterAll(async () => {
    await deleteVectorBucket(client, testVectorBucketName, testAccountId);
  }, NEVER_TIMEOUT);

  it(
    'should create a vector index successfully with basic parameters',
    async () => {
      const testIndexName = 'test-index-basic-' + Date.now();
      const input = {
        vectorBucketName: testVectorBucketName,
        accountID: testAccountId,
        indexName: testIndexName,
        dataType: DataType.DataTypeFloat32,
        dimension: 128,
        distanceMetric: DistanceMetricType.DistanceMetricEuclidean,
      };

      const result = await client.createIndex(input);

      expect(result).toBeDefined();
      expect(result.statusCode).toBe(200);
      expect(result.data).toBeDefined();
      expect(result.requestId).toBeDefined();
      expect(result.headers).toBeDefined();

      const getIndexResult = await client.getIndex({
        vectorBucketName: testVectorBucketName,
        accountID: testAccountId,
        indexName: testIndexName,
      });
      expect(getIndexResult.statusCode).toBe(200);
      expect(getIndexResult.data.index.indexName).toBe(input.indexName);
      expect(getIndexResult.data.index.dataType).toBe(input.dataType);
      expect(getIndexResult.data.index.dimension).toBe(input.dimension);
      expect(getIndexResult.data.index.distanceMetric).toBe(
        input.distanceMetric
      );

      const deleteRes = await client.deleteIndex({
        vectorBucketName: testVectorBucketName,
        accountID: testAccountId,
        indexName: testIndexName,
      });
      expect(deleteRes.statusCode).toBe(200);

      try {
        await client.getIndex({
          vectorBucketName: testVectorBucketName,
          accountID: testAccountId,
          indexName: testIndexName,
        });
        fail('Should throw error');
      } catch (error) {
        if (!(error instanceof TosServerError)) throw error;
        expect(error.statusCode).toBe(404);
        expect(error.data?.Code).toBe('VectorIndexNotFound');
      }
    },
    NEVER_TIMEOUT
  );

  it(
    'should create a vector index successfully with metadata configuration',
    async () => {
      const testIndexName = 'test-index-metadata-' + Date.now();
      const input = {
        vectorBucketName: testVectorBucketName,
        accountID: testAccountId,
        indexName: testIndexName,
        dataType: DataType.DataTypeFloat32,
        dimension: 256,
        distanceMetric: DistanceMetricType.DistanceMetricCosine,
        metadataConfiguration: {
          nonFilterableMetadataKeys: ['timestamp', 'source', 'category'],
        },
      };

      const result = await client.createIndex(input);
      expect(result).toBeDefined();
      expect(result.statusCode).toBe(200);
      expect(result.data).toBeDefined();

      const getIndexResult = await client.getIndex({
        vectorBucketName: testVectorBucketName,
        accountID: testAccountId,
        indexName: testIndexName,
      });
      expect(getIndexResult.statusCode).toBe(200);
      expect(getIndexResult.data.index.indexName).toBe(input.indexName);
      expect(getIndexResult.data.index.dataType).toBe(input.dataType);
      expect(getIndexResult.data.index.dimension).toBe(input.dimension);
      // expect(getIndexResult.data.index.distanceMetric).toBe(
      //   input.distanceMetric
      // );
      expect(getIndexResult.data.index.metadataConfiguration).toBeDefined();
      expect(
        getIndexResult.data.index.metadataConfiguration
          .nonFilterableMetadataKeys
      ).toEqual(input.metadataConfiguration?.nonFilterableMetadataKeys);
    },
    NEVER_TIMEOUT
  );

  it(
    'validate account id and bucket name',
    async () => {
      const [err] = await safeAwait(
        client.getVectorBucket({
          vectorBucketName: '-aaaa',
          accountID: testAccountId,
        })
      );
      expect(err).toBeDefined();
      expect(err.toString()).toContain(
        `invalid vector bucket name, the vector bucket name can be neither starting with '-' nor ending with '-'`
      );

      const [err2] = await safeAwait(
        client.getVectorBucket({
          vectorBucketName: 'aaaa-',
          accountID: testAccountId,
        })
      );
      expect(err2).toBeDefined();
      expect(err2.toString()).toContain(
        `invalid vector bucket name, the vector bucket name can be neither starting with '-' nor ending with '-'`
      );

      const [err3] = await safeAwait(
        client.getVectorBucket({
          vectorBucketName: 'a',
          accountID: testAccountId,
        })
      );
      expect(err3).toBeDefined();
      expect(err3.toString()).toContain(
        'invalid vector bucket name, the length must be [3, 32]'
      );

      const [err4] = await safeAwait(
        client.getVectorBucket({
          vectorBucketName: 'a'.repeat(33),
          accountID: testAccountId,
        })
      );
      expect(err4).toBeDefined();
      expect(err4.toString()).toContain(
        'invalid vector bucket name, the length must be [3, 32]'
      );

      const [err5] = await safeAwait(
        client.getVectorBucket({
          vectorBucketName: 'aa#a',
          accountID: testAccountId,
        })
      );
      expect(err5).toBeDefined();
      expect(err5.toString()).toContain(
        'invalid vector bucket name, the character set is illegal'
      );

      const [err6] = await safeAwait(
        client.deleteVectorBucket({
          vectorBucketName: testVectorBucketName,
          accountID: 'a12a',
        })
      );
      expect(err6).toBeDefined();
      expect(err6.toString()).toContain(
        'invalid account id, the account id must be a number'
      );

      const [err7] = await safeAwait(
        client.deleteVectorBucket({
          vectorBucketName: testVectorBucketName,
          accountID: '',
        })
      );
      expect(err7).toBeDefined();
      expect(err7.toString()).toContain(
        'invalid account id, the account id must be non-empty'
      );
    },
    NEVER_TIMEOUT
  );
});
