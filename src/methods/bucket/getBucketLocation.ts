import TOSBase from '../base';

export interface GetBucketLocationInput {
  bucket: string;
}

export interface GetBucketLocationOutput {
  ExtranetEndpoint: string;
  IntranetEndpoint: string;
  Region: string;
}

export async function getBucketLocation(
  this: TOSBase,
  input: GetBucketLocationInput
) {
  const { bucket } = input;

  return this.fetchBucket<GetBucketLocationOutput>(
    bucket,
    'GET',
    { location: '' },
    {}
  );
}
