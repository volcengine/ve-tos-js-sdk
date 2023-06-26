import TOSBase from '../base';
import { convertNormalCamelCase2Upper, paramsSerializer } from '../../utils';
import { StorageClassType } from '../../TosExportEnum';
export type JobStatusType =
  | 'New'
  | 'Preparing'
  | 'Suspended'
  | 'Ready'
  | 'Active'
  | 'Pausing'
  | 'Paused'
  | 'Complete'
  | 'Cancelling'
  | 'Cancelled'
  | 'Failing'
  | 'Failed';

export type DirectiveType = 'COPY' | 'REPLACE' | 'ADD';
export type CannedAccessControlListType = 'default' | 'private' | 'public-read';
export type PermissionType = 'READ' | 'READ_ACP' | 'WRITE_ACP' | 'FULL_CONTROL';
export type PrefixReplaceType = 'true' | 'false';
export type ConfirmationRequiredType = '0' | '1';

export interface Tag {
  Key: string;
  Value: string;
}

interface Manifest {
  Location: {
    ETag: string;
    ObjectTrn: string;
    ObjectVersionId?: string;
  };
  Spec: {
    Format: 'TOSInventoryReport_CSV_V1';
  };
}

export interface NewObjectMetadataType {
  SSEAlgorithm?: 'AES256';
  UserMetadata?: {
    member: { Key: string; Value: string }[];
  };
  'content-type'?: string;
  'content-encoding'?: string;
  'content-language'?: string;
  'cache-control'?: string;
  'content-disposition'?: string;
  expires?: string;
}
export interface NewObjectTaggingType {
  TOSTag?: Tag[];
}
export interface Report {
  Bucket: string;
  Enabled: PrefixReplaceType;
  Format: 'Report_CSV_V1';
  Prefix: string;
  ReportScope: 'AllTasks' | 'FailedTasksOnly';
}

export interface ProgressSummary {
  TotalNumberOfTasks: number;
  NumberOfTasksSucceeded: number;
  NumberOfTasksFailed: number;
}

export interface ListBatchInput {
  accountId: string;
  jobStatuses?: string[];
  nextToken?: string;
  maxResults?: number;
}

export interface UpdateJobPriorityInput {
  jobId: string;
  priority: number;
  accountId: string;
}
export interface UpdateJobStatusInput {
  jobId: string;
  accountId: string;
  requestedJobStatus: 'Ready' | 'Cancelled';
  statusUpdateReason?: string;
}

export interface JobInput {
  JobId: string;
  accountId: string;
}

export type DeleteJob = JobInput;
export type DescribeJob = JobInput;

export interface AccessControlList {
  TOSGrant: {
    Grantee: {
      Identifier: string;
      TypeIdentifier: 'id';
    };
    Permission: PermissionType;
  }[];
}
export interface TOSPutObjectCopy {
  TOSPutObjectCopy: {
    PrefixReplace: PrefixReplaceType;
    ResourcesPrefix: string;
    TargetKeyPrefix: string;
    StorageClass: StorageClassType;
    AccessControlDirective: DirectiveType;
    CannedAccessControlList?: CannedAccessControlListType;
    AccessControlGrants?: AccessControlList;
    TargetResource: string;
    MetadataDirective: DirectiveType;
    NewObjectMetadata: NewObjectMetadataType;
    TaggingDirective: DirectiveType;
    NewObjectTagging: NewObjectTaggingType;
  };
}

export interface TOSPutObjectAcl {
  TOSPutObjectAcl: {
    AccessControlPolicy: {
      CannedAccessControlList: CannedAccessControlListType;
      AccessControlList: AccessControlList;
    };
  };
}

export interface TOSPutObjectTagging {
  TOSPutObjectTagging: {
    TOSTag: Tag[];
  };
}

export interface TOSDeleteObjectTagging {
  TOSDeleteObjectTagging: {};
}

export type PutJobInput = {
  accountId: string;
  clientRequestToken: string;
  confirmationRequired: '0' | '1';
  description?: string;
  manifest: Manifest;
  priority: string;
  roleTrn: string;
  report?: Report;
  operation?:
    | TOSPutObjectCopy
    | TOSPutObjectAcl
    | TOSPutObjectTagging
    | TOSDeleteObjectTagging;
};

export interface DescribeJobRes {
  Job: {
    JobId: string;
    ConfirmationRequired: ConfirmationRequiredType;
    Description?: string;
    FailureReasons?: {
      JobFailure: {
        FailureCode: string;
        FailureReason: string;
      };
    };
    Manifest: Manifest;
    Priority: number;
    ProgressSummary: ProgressSummary;
    Report: Report;
    RoleArn: string;
    Status: JobStatusType;
    StatusUpdateReason: string;
    SuspendedDate: string;
    TerminationDate: string;
    CreationTime: string;
    Operation:
      | TOSPutObjectCopy
      | TOSPutObjectAcl
      | TOSPutObjectTagging
      | TOSDeleteObjectTagging;
  };
}

export interface JobList {
  JobId: string;
  CreationTime: string;
  Operation:
    | 'TOSPutObjectCopy'
    | 'TOSPutObjectAcl'
    | 'TOSPutObjectTagging'
    | 'TOSDeleteObjectTagging';
  Priority: number;
  ProgressSummary: ProgressSummary;
  Status: JobStatusType;
  TerminationDate: string;
  Description: string;
}
export interface JobListRes {
  Jobs: {
    member: JobList[];
  };
  NextToken: string;
}

export async function createJob(this: TOSBase, params: PutJobInput) {
  const { accountId, ...reset } = params;
  const data = convertNormalCamelCase2Upper(reset);
  const res = await this.fetch(
    'POST',
    '/jobs',
    {},
    {
      'x-tos-account-id': accountId,
    },
    {
      ...data,
    }
  );
  return res;
}

/**
 * @private unstable method
 * @description  获取批量任务列表
 * @param params
 * @returns
 */
export async function listJobs(this: TOSBase, params: ListBatchInput) {
  const {
    accountId,
    jobStatuses = '',
    maxResults = 1000,
    nextToken = '',
  } = params;
  const res = await this.fetch<JobListRes>(
    'GET',
    '/jobs',
    {
      jobStatuses,
      maxResults,
      nextToken,
    },
    {
      'x-tos-account-id': accountId,
    },
    {},
    {
      axiosOpts: {
        paramsSerializer,
      },
    }
  );
  return res;
}

/**
 *
 * @private unstable method
 * @description 更新批量任务优先级
 * @param params
 * @returns
 */
export async function updateJobPriority(
  this: TOSBase,
  params: UpdateJobPriorityInput
) {
  const { accountId, jobId: JobId, priority } = params;
  const res = await this.fetch(
    'POST',
    `/jobs/${JobId}/priority`,
    {
      priority,
    },
    {
      'x-tos-account-id': accountId,
    },
    {},
    {
      needMd5: true,
    }
  );
  return res;
}

/**
 *
 * @private unstable method
 * @description 更新批量任务优先级
 * @param params
 * @returns
 */
export async function updateJobStatus(
  this: TOSBase,
  params: UpdateJobStatusInput
) {
  const {
    accountId,
    jobId: JobId,
    requestedJobStatus,
    statusUpdateReason,
  } = params;
  const res = await this.fetch(
    'POST',
    `/jobs/${JobId}/status`,
    {
      requestedJobStatus,
      statusUpdateReason,
    },
    {
      'x-tos-account-id': accountId,
    },
    {},
    {
      needMd5: true,
    }
  );
  return res;
}

/**
 *
 * @private unstable method
 * @description 删除批量任务
 * @param params
 * @returns
 */
export async function deleteJob(this: TOSBase, params: DeleteJob) {
  const { accountId, JobId } = params;
  const res = await this.fetch(
    'DELETE',
    `/jobs/${JobId}`,
    {},
    {
      'x-tos-account-id': accountId,
    },
    {}
  );
  return res;
}

/**
 *
 * @private unstable method
 * @description 获取批量任务详情
 * @param params
 * @returns
 */
export async function describeJob(this: TOSBase, params: DescribeJob) {
  const { accountId, JobId } = params;
  const res = await this.fetch<DescribeJobRes>(
    'GET',
    `/jobs/${JobId}`,
    {},
    {
      'x-tos-account-id': accountId,
    },
    {}
  );
  return res;
}
