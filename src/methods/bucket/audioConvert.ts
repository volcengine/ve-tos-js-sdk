import TOSBase from '../base';

export interface createBucketAudioConvertInput {
  bucket: string;
  Input: {
    Object: string;
  };
  AudioConvertConfig: {
    ContainerFormat: string; // 封装格式
    BitRate: number;
  };
  Output: {
    Region: string;
    Bucket: string;
    Object: string;
  };
}

export interface createBucketAudioConvertOutput {}

/**
 * @private unstable method
 */
export async function createBucketAudioConvert(
  this: TOSBase,
  input: createBucketAudioConvertInput
) {
  const { bucket, Input, Output, AudioConvertConfig } = input;
  const res = await this.fetchBucket<createBucketAudioConvertOutput>(
    bucket,
    'POST',
    { job_type: 'AudioConvert', media_jobs: '' },
    {},
    { Input, AudioConvertConfig, Output }
  );

  if (!res.data) {
    res.data = {};
  }

  return res;
}
