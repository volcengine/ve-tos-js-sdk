import { handleEmptyServerError } from '../../handleEmptyServerError';
import {
  TemplateTagType,
  AudioContainerFormatType,
  SampleFormatType,
  ContainerFormatType,
} from '../../TosExportEnum';
import TOSBase, { TosResponse } from '../base';

export interface AudioConvertConfig {
  TimeInterval?: {
    Start?: number;
    Duration?: number;
  };
  ContainerFormat: AudioContainerFormatType;
  BitRate?: number;
  BitRateOpt?: number;
  SampleFormat?: string;
  SampleRate?: number;
  Channels?: number;
}

export interface PutBucketDataProcessTemplateInput {
  bucket: string;
  tag: TemplateTagType;
  name: string;
  audioConvertConfig: AudioConvertConfig;
}

export interface PutBucketDataProcessTemplateOutput {}

/**
 * @private unstable method
 */
export async function putBucketDataProcessTemplate(
  this: TOSBase,
  input: PutBucketDataProcessTemplateInput
): Promise<TosResponse<PutBucketDataProcessTemplateOutput>> {
  const { bucket, tag, name, audioConvertConfig } = input;
  const res = await this.fetchBucket(
    bucket,
    'PUT',
    { process_template: '', tag },
    {},
    {
      Tag: tag,
      Name: name,
      AudioConvertConfig: audioConvertConfig,
    }
  );
  res.data = {};
  return res as TosResponse<PutBucketDataProcessTemplateOutput>;
}

export interface ListBucketDataProcessTemplatesInput {
  bucket: string;
  tag: TemplateTagType;
  prefix?: string;
}

export interface TemplateItem {
  Tag: TemplateTagType;
  ID: string;
  Name: string;
  AudioConvertConfig: AudioConvertConfig;
}

export type ListBucketDataProcessTemplatesOutput = TemplateItem[];

/**
 * @private unstable method
 */
export async function listBucketDataProcessTemplates(
  this: TOSBase,
  input: ListBucketDataProcessTemplatesInput
): Promise<TosResponse<ListBucketDataProcessTemplatesOutput>> {
  const { bucket, tag, prefix } = input;
  const query: Record<string, string> = {
    process_template: '',
    tag,
  };

  if (prefix) {
    query.prefix = prefix;
  }

  const res = await this.fetchBucket<ListBucketDataProcessTemplatesOutput>(
    bucket,
    'GET',
    query,
    {}
  );
  return res;
}

export interface GetBucketDataProcessTemplateInput {
  bucket: string;
  id: string;
  tag: TemplateTagType;
}

export type GetBucketDataProcessTemplateOutput = TemplateItem | null;

/**
 * @private unstable method
 */
export async function getBucketDataProcessTemplate(
  this: TOSBase,
  input: GetBucketDataProcessTemplateInput
): Promise<TosResponse<GetBucketDataProcessTemplateOutput>> {
  const { bucket, id, tag } = input;
  const query: Record<string, string> = {
    process_template: '',
    tag,
    id,
  };

  try {
    const res = await this.fetchBucket<GetBucketDataProcessTemplateOutput>(
      bucket,
      'GET',
      query,
      {}
    );
    return res;
  } catch (err) {
    return handleEmptyServerError<GetBucketDataProcessTemplateOutput>(err, {
      enableCatchEmptyServerError: this.opts.enableOptimizeMethodBehavior,
      defaultResponse: null,
      methodKey: 'getBucketDataProcessTemplate',
    });
  }
}

export interface DeleteBucketDataProcessTemplateInput {
  bucket: string;
  id: string;
}

export interface DeleteBucketDataProcessTemplateOutput {}

/**
 * @private unstable method
 */
export async function deleteBucketDataProcessTemplate(
  this: TOSBase,
  input: DeleteBucketDataProcessTemplateInput
): Promise<TosResponse<DeleteBucketDataProcessTemplateOutput>> {
  const { bucket, id } = input;
  const res = await this.fetchBucket(
    bucket,
    'DELETE',
    { process_template: '', id },
    {},
    ''
  );
  res.data = {};
  return res as TosResponse<DeleteBucketDataProcessTemplateOutput>;
}

