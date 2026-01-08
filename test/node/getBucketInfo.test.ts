import TOS, { AzRedundancyType, StatusType, StorageClassType } from '../../src/browser-index';
import { testAccountId, tosOptions } from '../utils/options';

const client = new TOS({
  ...tosOptions,
});

describe(`get bucket info`, () => {
  it('get bucket info basic', async () => {
    const bucketName = `js-sdk` + Date.now();
    await client.createBucket({
      bucket: bucketName,
    });
  
    await client.putBucketEncryption({
      bucket: bucketName,
      rule: {
        ApplyServerSideEncryptionByDefault: {
          SSEAlgorithm: 'kms',
          KMSMasterKeyID: 'abc'
        },
      },
    });

    const result = await client.getBucketInfo({
      bucket: bucketName,
    });

    expect(result.statusCode).toBe(200);
    expect(result.data.Bucket.Name).toBe(bucketName);
    expect(result.data.Bucket.Owner.ID).toBe(testAccountId);
    expect(result.data.Bucket.CreationDate).toBeTruthy();
    expect(result.data.Bucket.StorageClass).toBe(StorageClassType.StorageClassStandard);
    expect(result.data.Bucket.ProjectName).toBe('default');
    expect(result.data.Bucket.Type).toBe('fns');
    expect(result.data.Bucket.Location).toBe(tosOptions.region);
    expect(result.data.Bucket.AzRedundancy).toBe(AzRedundancyType.AzRedundancySingleAz);
    expect(result.data.Bucket.ExtranetEndpoint).toBeTruthy();
    expect(result.data.Bucket.IntranetEndpoint).toBeTruthy();
    expect(result.data.Bucket.ExtranetS3Endpoint).toBeTruthy();
    expect(result.data.Bucket.IntranetS3Endpoint).toBeTruthy();
    expect(result.data.Bucket.Versioning).toBe('');
    expect(result.data.Bucket.CrossRegionReplication).toBe(StatusType.Disabled);
    expect(result.data.Bucket.TransferAcceleration).toBe(StatusType.Disabled);
    expect(result.data.Bucket.AccessMonitor).toBe(StatusType.Disabled);
    expect(result.data.Bucket.ServerSideEncryptionConfiguration).toBeTruthy();
    expect(result.data.Bucket.ServerSideEncryptionConfiguration.Rule?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('kms');
    expect(result.data.Bucket.ServerSideEncryptionConfiguration.Rule?.ApplyServerSideEncryptionByDefault?.KMSMasterKeyID).toBe('abc');


    await client.deleteBucket(bucketName);
  });
});
