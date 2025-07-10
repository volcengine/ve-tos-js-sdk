import { handleEmptyServerError } from '../../handleEmptyServerError';
import { AuditJobStateType, AuditScanType } from '../../TosExportEnum';
import TOSBase from '../base';

export interface GetBucketAuditInput {
  bucket: string;
}

export interface GetBucketAuditOutputBody {
  TosAuditConfig: {
    /** 是否启用 */
    Enable: boolean;
    /** bucket 绑定的内容审核 APP Name */
    AppName: string;
    /** bucket 绑定的内容审核 APP ID */
    AppId: number;
    /** bucket 绑定的内容审核 APP 中文名 */
    AppNameZh: string;
    AppType: string;
    /** 这是一个示例应用的描述 */
    Description: string;
  };
  /** 0 为 Inactive ，1 为 Activating，2 为 ActivationFailed，3 为 Active */
  ServiceAppStatus: number;
  /** 审核服务应用状态消息 */
  ServiceAppStatusMessage: string;
}

export type GetBucketAuditOutput = GetBucketAuditOutputBody | null;

/**
 * @private unstable method
 */
export async function getBucketAudit(
  this: TOSBase,
  input: GetBucketAuditInput
) {
  const { bucket } = input;
  try {
    return await this.fetchBucket<GetBucketAuditOutput>(
      bucket,
      'GET',
      {
        audit: '',
      },
      {}
    );
  } catch (err) {
    return handleEmptyServerError<GetBucketAuditOutput>(err, {
      enableCatchEmptyServerError: this.opts.enableOptimizeMethodBehavior,
      methodKey: 'getBucketAudit',
      defaultResponse: null,
    });
  }
}

export interface PutBucketAuditInput {
  bucket: string;
  action: 'create' | 'enable' | 'disable' | 'retry';
}
export interface PutBucketAuditOutput {}

/**
 * @private unstable method
 */
export async function putBucketAudit(
  this: TOSBase,
  input: PutBucketAuditInput
) {
  const { bucket, action } = input;
  return await this.fetchBucket<GetBucketAuditOutput>(
    bucket,
    'PUT',
    {
      action,
      audit: '',
    },
    {}
  );
}

export interface ImageAudit {
  Suffix?: string[];
  BizType: string;
  PerDayLimit?: number;
}

export interface VideoAudit {
  Suffix?: string[];
  BizType: string;
  Interval?: number;
  PerDayLimit?: number;
  ResultType?: number;
}

export interface AudioAudit {
  Suffix?: string[];
  BizType: string;
  PerDayLimit?: number;
  ResultType?: number;
}

export interface ScanConf {
  Objects?: string[];
  Type: AuditScanType;
  ManifestURL?: string[];
  ObjectPrefixAllowed?: string[];
  ObjectPrefixDenied?: string[];
  TimestampStart?: number;
  TimestampEnd?: number;
}

export interface AuditItem {
  JobID: string;
  State: AuditJobStateType;
  CreateTime: string;
  StartTime: string;
  EndTime: string;
  Error?: string;
  Code?: number;
  Message?: string;
  ImageAudit?: ImageAudit;
  VideoAudit?: VideoAudit;
  AudioAudit?: AudioAudit;
  ScanConf: ScanConf;
}

export interface ListBucketAuditJobInput {
  bucket: string;
  /**
   * Used to filter the start time of the job, unix timestamp.
   */
  startTime?: number;
  /**
   * Used to filter the end time of the job, unix timestamp.
   */
  endTime?: number;
  /**
   * The size of pagination, maximum 100? TODO
   */
  pageSize: number;
  /**
   * The starting token for pagination.
   */
  pageToken?: string;
}

export interface ListBucketAuditJobOutput {
  Items: AuditItem[];
  NextPageToken?: string;
  JobType: string;
}

/**
 * @private unstable method
 */
export async function listBucketAuditJob(
  this: TOSBase,
  input: ListBucketAuditJobInput
) {
  const { bucket, startTime, endTime, pageSize, pageToken } = input;
  const query: Record<string, string> = {
    job_type: 'AuditStock',
  };

  if (startTime !== undefined) {
    query['start_time'] = startTime.toString();
  }
  if (endTime !== undefined) {
    query['end_time'] = endTime.toString();
  }
  if (pageSize !== undefined) {
    query['page_size'] = pageSize.toString();
  }
  if (pageToken !== undefined) {
    query['page_token'] = pageToken;
  }

  const res = await this.fetchBucket<ListBucketAuditJobOutput>(
    bucket,
    'GET',
    query,
    {}
  );
  return res;
}

export interface GetBucketAuditJobInput {
  bucket: string;
  jobId: string;
}
export type GetBucketAuditJobOutput = AuditItem | null;

/**
 * @private unstable method
 */
export async function getBucketAuditJob(
  this: TOSBase,
  input: GetBucketAuditJobInput
) {
  const { bucket, jobId } = input;
  try {
    const res = await this.fetchBucket<GetBucketAuditJobOutput>(
      bucket,
      'GET',
      {
        job_type: 'AuditStock',
        job_id: jobId,
      },
      {}
    );
    return res;
  } catch (e) {
    return handleEmptyServerError<GetBucketAuditJobOutput>(e, {
      enableCatchEmptyServerError: this.opts.enableOptimizeMethodBehavior,
      methodKey: 'getBucketAuditJob',
      defaultResponse: null,
    });
  }
}

export interface PostBucketAuditJobInput {
  bucket: string;
  job: {
    ImageAudit?: ImageAudit;
    VideoAudit?: VideoAudit;
    AudioAudit?: AudioAudit;
    ScanConf: ScanConf;
  };
}

export interface PostBucketAuditJobOutput {}
/**
 * @private unstable method
 */
export async function postBucketAuditJob(
  this: TOSBase,
  input: PostBucketAuditJobInput
) {
  const { bucket, job } = input;
  const res = await this.fetchBucket<PostBucketAuditJobOutput>(
    bucket,
    'POST',
    {
      job_type: 'AuditStock',
      audit_jobs: '',
    },
    {},
    job
  );
  return res;
}

interface ConfigItem {
  Name: string;
  BizType: number;
  Scene: string;
  SceneText: string;
  LabelTexts: string[];
  Labels: string;
}

export interface ListBucketAuditBizTypeOutput {
  BizType: string;
  Configs: ConfigItem[];
}

export interface ListBucketAuditBizTypeInput {
  bucket: string;
  audit_type: string;
}

/**
 * @private unstable method
 */
export async function listBucketAuditBizType(
  this: TOSBase,
  input: ListBucketAuditBizTypeInput
) {
  const { bucket, audit_type } = input;
  return this.fetchBucket<ListBucketAuditBizTypeOutput>(
    bucket,
    'GET',
    {
      type: audit_type,
      audits: '',
    },
    {}
  );
}
