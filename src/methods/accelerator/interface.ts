import { AcceleratorPrefetchJobStatus } from "../../TosExportEnum";

/**
 * 加速器
 */
export interface Accelerator {
  Name: string;
  Region: string;
  AZ: string;
  CacheCapacity: {
    Value: number;
    Unit: string;
  };
  CachePolicy: Array<{
    CachePath: string;
    IsSync: boolean;
  }>;
  Id: string;
  CreateTime: number;
  UpdateTime: number;
  Account: string;
}

/**
 * 创建/编辑加速器入参
 */
export interface PutAcceleratorInput extends Omit<Accelerator, 'Account' | 'Id' | 'CreateTime' | 'UpdateTime'> {
  AccountId: string;
}

/**
 * 创建/编辑加速器出参
 */
export interface PutAcceleratorOutput {
  Id: string;
}

/**
 * 获取加速器入参
 */
export interface GetAcceleratorInput {
  Id: string;
  AccountId: string;
}

/**
 * 获取加速器出参
 */
export type GetAcceleratorOutput = Accelerator;

/**
 * 删除加速器入参
 */
export interface DeleteAcceleratorInput {
  Id: string;
  AccountId: string;
}

/**
 * 删除加速器出参
 */
export interface DeleteAcceleratorOutput {}

/**
 * 列举加速器入参
 */
export interface ListAcceleratorsInput {
  AccountId: string;
  maxResults?: number;
  nextToken?: string;
}

/**
 * 列举加速器出参
 */
export interface ListAcceleratorsOutput {
  Accelerators: Accelerator[];
  NextToken?: string;
}

/**
 * 获取加速器可用区列表入参
 */
export interface ListAcceleratorAzsInput {
  AccountId: string;
  region: string;
}

/**
 * 获取加速器可用区列表入参
 */
export interface ListAcceleratorAzsOutput {
  Region: string;
  SupportAZ: string[];
}

/**
 * 加速器预热任务
 */
export interface AcceleratorPrefetchJob {
  Account: string;
  AcceleratorId: string;
  JobId: string;
  JobDescription: string;
  Status: AcceleratorPrefetchJobStatus;
  PrefetchPolicy: Array<{
    CachePath: string;
  }>;
}

/**
 * 创建加速器预热任务入参
 */
export interface PutAcceleratorPrefetchJobInput {
  AccountId: string;
  AcceleratorName: string;
  AcceleratorId: string;
  JobId?: string;
  Status: AcceleratorPrefetchJobStatus;
  JobDescription: AcceleratorPrefetchJob['JobDescription'];
  PrefetchPolicy: AcceleratorPrefetchJob['PrefetchPolicy'];
  StartAfterCreated?: boolean;
}

/**
 * 创建加速器预热任务入参
 */
export interface PutAcceleratorPrefetchJobOutput {
  JobId: string;
}

/**
 * 获取加速器预热任务入参
 */
export interface GetAcceleratorPrefetchJobInput {
  AccountId: string;
  JobId: string;
}

/**
 * 获取加速器预热任务出参
 */
export interface GetAcceleratorPrefetchJobOutput extends AcceleratorPrefetchJob {}

/**
 * 删除加速器预热任务入参
 */
export interface DeleteAcceleratorPrefetchJobInput {
  AccountId: string;
  JobId: string;
}

/**
 * 删除加速器预热任务出参
 */
export interface DeleteAcceleratorPrefetchJobOutput {}

/**
 * 列举加速器预热任务入参
 */
export interface ListAcceleratorPrefetchJobsInput {
  AccountId: string;
  AcceleratorId: string;
  maxResults?: number;
  nextToken?: string;
}

/**
 * 列举加速器预热任务出参
 */
export interface ListAcceleratorPrefetchJobsOutput {
  AcceleratorPrefetchJobs: AcceleratorPrefetchJob[];
  NextToken?: string;
}

/**
 * 加速器预热任务历史记录
 */
export interface AcceleratorPrefetchJobRecord {
  SuccessCount: number;
  TotalCount: number;
  StartAt: number;
  EndAt: number;
}

/**
 * 列举加速器预热任务历史记录入参
 */
export interface ListAcceleratorPrefetchJobRecordsInput {
  AccountId: string;
  JobId: string;
  maxResults?: number;
  nextToken?: string;
}

/**
 * 列举加速器预热任务历史记录出参
 */
export interface ListAcceleratorPrefetchJobRecordsOutput {
  JobRecords: AcceleratorPrefetchJobRecord[];
  NextToken?: string;
}
