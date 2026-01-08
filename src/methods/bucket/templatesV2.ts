import { AudioContainerFormatType, ContainerFormatType } from '../../TosExportEnum';
import TOSBase, { TosResponse } from '../base';

export interface AudioConvertConfig {
  TimeInterval?: TimeInterval;
  ContainerFormat: AudioContainerFormatType;
  BitRate?: number;
  BitRateOpt?: number;
  SampleFormat?: string;
  SampleRate?: number;
  Channels?: number;
}

// PutAudioConvertTemplate interfaces
export interface PutAudioConvertTemplateInput {
  bucket: string;
  name: string;
  audioConvertConfig: AudioConvertConfig;
}

export interface PutAudioConvertTemplateOutput {
  ID: string;
}

/**
 * @private unstable method
 */
export async function putAudioConvertTemplate(
  this: TOSBase,
  input: PutAudioConvertTemplateInput
): Promise<TosResponse<PutAudioConvertTemplateOutput>> {
  const { bucket, name, audioConvertConfig } = input;

  // Build query parameters
  const query = {
    process_template: '',
    tag: 'AudioConvert' as const,
  };

  // Build request headers
  const headers = {
    'Content-Type': 'application/json',
  };

  // Build request body
  const body = {
    Tag: 'AudioConvert',
    Name: name,
    AudioConvertConfig: audioConvertConfig,
  };

  const res = await this.fetchBucket<PutAudioConvertTemplateOutput>(
    bucket,
    'PUT',
    query,
    headers,
    body
  );

  // Ensure res.data exists and contains templateId
  res.data = { ID: res.data as unknown as string };

  return res;
}

export interface GetAudioConvertTemplateInput {
  bucket: string;
  id: string;
}

export interface GetAudioConvertTemplateOutput {
  Tag: string;
  ID: string;
  Name: string;
  AudioConvertConfig: AudioConvertConfig;
}

/**
 * @private unstable method
 */
export async function getAudioConvertTemplate(
  this: TOSBase,
  input: GetAudioConvertTemplateInput
): Promise<TosResponse<GetAudioConvertTemplateOutput>> {
  const { bucket, id } = input;

  // Build query parameters
  const query: Record<string, string> = {
    process_template: '',
    tag: 'AudioConvert',
    id,
  };

  const res = await this.fetchBucket<GetAudioConvertTemplateOutput>(
    bucket,
    'GET',
    query,
    {}
  );

  return res;
}

// ListAudioConvertTemplates interfaces
export interface ListAudioConvertTemplatesInput {
  bucket: string;
  id?: string;
}

export interface AudioConvertTemplate {
  Tag: string;
  ID: string;
  Name: string;
  AudioConvertConfig: AudioConvertConfig;
}

export interface ListAudioConvertTemplatesOutput {
  AudioConvertTemplates: Array<AudioConvertTemplate>;
}

/**
 * @private unstable method
 */
export async function listAudioConvertTemplates(
  this: TOSBase,
  input: ListAudioConvertTemplatesInput
): Promise<TosResponse<ListAudioConvertTemplatesOutput>> {
  const { bucket, id } = input;

  // Build query parameters
  const query: Record<string, string> = {
    process_template: '',
    tag: 'AudioConvert',
  };

  if (id) {
    query.id = id;
  }

  const res = await this.fetchBucket<any>(bucket, 'GET', query, {});
  res.data = { AudioConvertTemplates: res.data || [] };

  return res;
}

// DeleteAudioConvertTemplate interfaces
export interface DeleteAudioConvertTemplateInput {
  bucket: string;
  id: string;
}

export interface DeleteAudioConvertTemplateOutput {}

/**
 * @private unstable method
 */
export async function deleteAudioConvertTemplate(
  this: TOSBase,
  input: DeleteAudioConvertTemplateInput
): Promise<TosResponse<DeleteAudioConvertTemplateOutput>> {
  const { bucket, id } = input;

  // Build query parameters
  const query = {
    process_template: '',
    id,
  };

  const res = await this.fetchBucket(bucket, 'DELETE', query, {}, '');

  res.data = {};
  return res as TosResponse<DeleteAudioConvertTemplateOutput>;
}

export interface TimeInterval {
  Start?: number;
  Duration?: number;
}

export interface ClipConfig {
  Duration?: number;
}

export interface Container {
  Format: ContainerFormatType;
  ClipConfig?: ClipConfig;
}

export interface Video {
  Codec?: string;
  Width?: number;
  Height?: number;
  Crf?: number;
  PixFmt?: string;
  BitRate?: number;
  Fps?: number;
  Remove?: boolean;
}

export interface Audio {
  Codec?: string;
  BitRate?: number;
  SampleFormat?: string;
  SampleRate?: number;
  Channels?: number;
  Remove?: boolean;
}

export interface AIGCMetadata {
  Label: string;
  ContentProducer: string;
  ProduceID: string;
  ContentPropagator?: string;
  PropagateID?: string;
  ReservedCode1?: string;
  ReservedCode2?: string;
}

export interface TranscodeConfigOptions {
  AIGCMetadata?: AIGCMetadata;
}

export interface Transcode {
  TimeInterval?: TimeInterval;
  Container?: Container;
  Video?: Video;
  Audio?: Audio;
  Options?: TranscodeConfigOptions;
}

export interface PutVideoConvertTemplateInput {
  bucket: string;
  name: string;
  transcodeConfig: Transcode;
}

export interface PutVideoConvertTemplateOutput {
  ID: string;
}

/**
 * @private unstable method
 */
export async function putVideoConvertTemplate(
  this: TOSBase,
  input: PutVideoConvertTemplateInput
): Promise<TosResponse<PutVideoConvertTemplateOutput>> {
  const { bucket, name, transcodeConfig } = input;

  // Build query parameters
  const query: Record<string, string> = {
    process_template: '',
    tag: 'Transcode',
  };

  // Build request headers
  const headers = {};

  // Build request body
  const body = {
    Tag: 'Transcode',
    Name: name,
    TranscodeConfig: transcodeConfig,
  };

  const res = await this.fetchBucket<string>(
    bucket,
    'PUT',
    query,
    headers,
    body
  );

  return {
    ...res,
    data: {
      ID: res.data,
    },
  };
}

export interface GetVideoConvertTemplateInput {
  bucket: string;
  id: string;
}

export interface GetVideoConvertTemplateOutput {
  Tag: string;
  ID: string;
  Name: string;
  TranscodeConfig: Transcode;
}

/**
 * @private unstable method
 */
export async function getVideoConvertTemplate(
  this: TOSBase,
  input: GetVideoConvertTemplateInput
): Promise<TosResponse<GetVideoConvertTemplateOutput>> {
  const { bucket, id } = input;

  // Build query parameters
  const query: Record<string, string> = {
    process_template: '',
    tag: 'Transcode',
    id,
  };

  const res = await this.fetchBucket<GetVideoConvertTemplateOutput>(
    bucket,
    'GET',
    query,
    {}
  );

  return res;
}

export interface DeleteVideoConvertTemplateInput {
  bucket: string;
  id: string;
}

export interface DeleteVideoConvertTemplateOutput {}

/**
 * @private unstable method
 */
export async function deleteVideoConvertTemplate(
  this: TOSBase,
  input: DeleteVideoConvertTemplateInput
): Promise<TosResponse<DeleteVideoConvertTemplateOutput>> {
  const { bucket, id } = input;

  // Build query parameters
  const query = {
    process_template: '',
    id,
  };

  const res = await this.fetchBucket(
    bucket,
    'DELETE',
    query,
    {},
    ''
  );

  res.data = {};
  return res as TosResponse<DeleteVideoConvertTemplateOutput>;
}

export interface ListVideoConvertTemplatesInput {
  bucket: string;
}

export interface VideoConvertTemplate {
  Tag: string;
  ID: string;
  Name: string;
  TranscodeConfig: Transcode;
}

export interface ListVideoConvertTemplatesOutput {
  VideoConvertTemplates: Array<VideoConvertTemplate>;
}

/**
 * @private unstable method
 */
export async function listVideoConvertTemplates(
  this: TOSBase,
  input: ListVideoConvertTemplatesInput
): Promise<TosResponse<ListVideoConvertTemplatesOutput>> {
  const { bucket } = input;

  // Build query parameters
  const query: Record<string, string> = {
    process_template: '',
    tag: 'Transcode',
  };

  const res = await this.fetchBucket<any>(bucket, 'GET', query, {});
  res.data = { VideoConvertTemplates: res.data || [] };

  return res;
}
