import TOSBase, { TosResponse } from '../base';
import { AudioConvertConfig, Transcode } from './templatesV2';

export interface CreateVideoConvertJobInput {
  bucket?: string;
  input: ConvertJobInput;
  transcodeConfig: TranscodeConfig;
  output: ConvertJobOutput;
}

export interface ConvertJobInput {
  Object: string;
}

export interface TranscodeConfig {
  TemplateID?: string;
  Transcode?: Transcode;
}

export interface ConvertJobOutput {
  Region: string;
  Bucket: string;
  Object: string;
}

export interface CreateVideoConvertJobOutput {
  JobId: string;
}

export async function createVideoConvertJob(
  this: TOSBase,
  input: CreateVideoConvertJobInput
): Promise<TosResponse<CreateVideoConvertJobOutput>> {
  const { bucket, input: jobInput, transcodeConfig, output } = input;

  // 手动构建查询参数
  const query: Record<string, any> = {
    job_type: 'Transcode',
    media_jobs: '',
  };

  // 手动构建请求头
  const headers: Record<string, string> = {};

  // 构建请求体 - 由于接口字段已经是大驼峰格式，可以直接使用
  const body = {
    Tag: 'Transcode',
    Input: jobInput,
    TranscodeConfig: transcodeConfig,
    Output: output,
  };

  // 发送请求 - 使用 fetchBucket 因为这是存储桶级别的操作
  const res = await this.fetchBucket<CreateVideoConvertJobOutput>(
    bucket,
    'POST',
    query,
    headers,
    body
  );

  return res;
}

export interface GetVideoConvertJobInput {
  bucket?: string;
  jobId: string;
}

export interface GetVideoConvertJobOutput {
  JobID: string;
  CreateTime: string;
  StartTime?: string;
  EndTime?: string;
  State: string;
  Code: number;
  Message?: string;
  Input: ConvertJobInput;
  TranscodeConfig: TranscodeConfig;
  Output: ConvertJobOutput;
}

export async function getVideoConvertJob(
  this: TOSBase,
  input: GetVideoConvertJobInput
): Promise<TosResponse<GetVideoConvertJobOutput>> {
  const { bucket, jobId } = input;

  // 手动构建查询参数
  const query: Record<string, any> = {
    job_type: 'Transcode',
    job_id: jobId,
    media_jobs: '',
  };

  // 手动构建请求头
  const headers: Record<string, string> = {};

  // 发送请求 - 使用 fetchBucket 因为这是存储桶级别的操作
  const res = await this.fetchBucket<GetVideoConvertJobOutput>(
    bucket,
    'GET',
    query,
    headers
  );

  return res;
}

export interface CreateAudioConvertJobInput {
  bucket?: string;
  input: ConvertJobInput;
  audioConvertConfig: AudioConvertConfig;
  output: ConvertJobOutput;
}

export interface CreateAudioConvertJobOutput {
  JobId: string;
}

/**
 * @private unstable method
 */
export async function createAudioConvertJob(
  this: TOSBase,
  input: CreateAudioConvertJobInput
): Promise<TosResponse<CreateAudioConvertJobOutput>> {
  const { bucket, input: jobInput, audioConvertConfig, output } = input;

  // 手动构建查询参数
  const query: Record<string, any> = {
    job_type: 'AudioConvert',
    media_jobs: '',
  };

  // 手动构建请求头
  const headers: Record<string, string> = {};

  // 构建请求体
  const body = {
    Tag: 'AudioConvert',
    Input: jobInput,
    AudioConvertConfig: audioConvertConfig,
    Output: output,
  };

  // 发送请求
  const res = await this.fetchBucket<CreateAudioConvertJobOutput>(
    bucket,
    'POST',
    query,
    headers,
    body
  );

  return res;
}

export interface GetAudioConvertJobInput {
  bucket: string;
  jobId: string;
}

export interface GetAudioConvertJobOutput {
  JobID: string;
  CreateTime: string;
  StartTime?: string;
  EndTime?: string;
  State: string;
  Code: number;
  Message?: string;
  Input: ConvertJobInput;
  AudioConvertConfig: AudioConvertConfig;
  Output: ConvertJobOutput;
}

/**
 * @private unstable method
 */
export async function getAudioConvertJob(
  this: TOSBase,
  input: GetAudioConvertJobInput
) {
  const { bucket, jobId } = input;
  
  // 手动构建查询参数
  const query: Record<string, any> = {
    job_type: 'AudioConvert',
    job_id: jobId
  };
  
  // 手动构建请求头
  const headers = {};
  
  // 发送请求
  const res = await this.fetchBucket<GetAudioConvertJobOutput>(
    bucket,
    'GET',
    query,
    headers
  );
  
  // 直接返回响应
  return res;
}
