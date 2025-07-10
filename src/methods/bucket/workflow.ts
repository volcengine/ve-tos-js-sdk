import TOSBase from '../base';
import { WorkflowExecutionStateType } from '../../TosExportEnum';
import { handleEmptyServerError } from '../../handleEmptyServerError';

export interface ObjectExtFilter {
  AudioExts?: string[];
}

export interface Output {
  Region: string;
  Bucket: string;
  Object: string;
}

export interface AudioTranscode {
  OperationID: string;
  Format: string;
  Bitrate?: number;
  Output: Output;
}

export interface Operations {
  AudioTranscode?: AudioTranscode[];
}

export interface PutBucketWorkflowInput {
  bucket?: string;
  role: string;
  rules: WorkflowItem[];
}

export interface PutBucketWorkflowOutput {}

/**
 * @private unstable method
 */
export async function putBucketWorkflow(
  this: TOSBase,
  input: PutBucketWorkflowInput
) {
  const { bucket, role, rules } = input;

  if (this.opts.enableOptimizeMethodBehavior && !rules.length) {
    return deleteBucketWorkflow.call(this, { bucket });
  }

  return this.fetchBucket<PutBucketWorkflowOutput>(
    bucket,
    'PUT',
    {
      workflow: '',
    },
    {},
    {
      Role: role,
      Rules: rules,
    }
  );
}

export interface WorkflowItem {
  ID: string;
  Enabled: boolean;
  Prefix?: string;
  ExtFilter?: ObjectExtFilter;
  Topology: string[][];
  Operations: Operations;
}

export interface GetBucketWorkflowInput {
  bucket?: string;
}

export interface GetBucketWorkflowOutput {
  Rules: WorkflowItem[];
}

/**
 * @private unstable method
 */
export async function getBucketWorkflow(
  this: TOSBase,
  input: GetBucketWorkflowInput
) {
  const { bucket } = input;
  try {
    const res = await this.fetchBucket<GetBucketWorkflowOutput>(
      bucket,
      'GET',
      {
        workflow: '',
      },
      {}
    );
    return res;
  } catch (error) {
    return handleEmptyServerError<GetBucketWorkflowOutput>(error, {
      enableCatchEmptyServerError: this.opts.enableOptimizeMethodBehavior,
      methodKey: 'getBucketWorkflow',
      defaultResponse: {
        Rules: [],
      },
    });
  }
}

export interface ListBucketWorkflowInput {
  bucket?: string;
  pageSize: number;
  pageToken?: string;
}

export interface ListBucketWorkflowOutput {
  WorkflowItems: WorkflowItem[];
  NextPageToken?: string;
}

/**
 * @private unstable method
 */
export async function listBucketWorkflow(
  this: TOSBase,
  input: ListBucketWorkflowInput
) {
  const { bucket, pageSize, pageToken } = input;

  try {
    const res = await this.fetchBucket<ListBucketWorkflowOutput>(
      bucket,
      'GET',
      {
        workflow: '',
        page_size: pageSize,
        page_token: pageToken,
      },
      {}
    );
    return res;
  } catch (error) {
    return handleEmptyServerError<ListBucketWorkflowOutput>(error, {
      enableCatchEmptyServerError: this.opts.enableOptimizeMethodBehavior,
      methodKey: 'listBucketWorkflow',
      defaultResponse: { WorkflowItems: [] },
    });
  }
}

export interface DeleteBucketWorkflowInput {
  bucket?: string;
}
export interface DeleteBucketWorkflowOutput {}

/**
 * @private unstable method
 */
export async function deleteBucketWorkflow(
  this: TOSBase,
  input: DeleteBucketWorkflowInput
) {
  const { bucket } = input;
  const res = await this.fetchBucket<DeleteBucketWorkflowOutput>(
    bucket,
    'DELETE',
    {
      workflow: '',
    },
    {}
  );
  if (!res.data) {
    res.data = {};
  }
  return res;
}

export interface WorkflowExecutionTaskItem {
  Type: string;
  JobID: string;
  OperationID: string;
  State?: WorkflowExecutionStateType;
  CreateTime: string;
  StartTime: string;
  EndTime: string;
  Code: number;
  Message?: string;
}

export interface WorkflowExecutionItem {
  ExecutionID: string;
  RequestID: string;
  Object: string[];
  State?: WorkflowExecutionStateType;
  Workflow: WorkflowItem;
  Tasks: WorkflowExecutionTaskItem[];
  StartTime: string;
  CreateTime: string;
  EndTime: string;
}

export interface GetBucketWorkflowExecutionInput {
  bucket?: string;
  executionId: string;
}

export type GetBucketWorkflowExecutionOutput = WorkflowExecutionItem | null

/**
 * @private unstable method
 */

export async function getBucketWorkflowExecution(
  this: TOSBase,
  input: GetBucketWorkflowExecutionInput
) {
  const { bucket, executionId } = input;
  try {
    const res = await this.fetchBucket<WorkflowExecutionItem>(
      bucket,
      'GET',
      {
        workflow_execution: '',
        id: executionId,
      },
      {}
    );
    return res;
  } catch (error) {
    return handleEmptyServerError<GetBucketWorkflowExecutionOutput>(error, {
      enableCatchEmptyServerError: this.opts.enableOptimizeMethodBehavior,
      methodKey: 'getBucketWorkflowExecution',
      defaultResponse: null,
    });
  }
}

export interface ListBucketWorkflowExecutionInput {
  bucket?: string;
  workflowId?: string;
  startTime?: number;
  endTime?: number;
  states?: WorkflowExecutionStateType;
  orderByTime?: 'asc' | 'desc';
  pageSize?: number;
  pageToken?: string;
}

export interface ListBucketWorkflowExecutionOutput {
  Items: WorkflowExecutionItem[];
  NextPageToken?: string;
}

/**
 * @private unstable method
 */
export async function listBucketWorkflowExecution(
  this: TOSBase,
  input: ListBucketWorkflowExecutionInput
) {
  const {
    bucket,
    workflowId,
    startTime,
    endTime,
    states,
    orderByTime,
    pageSize,
    pageToken,
  } = input;
  try {
    const query: Record<string, string> = {
      workflow_execution: '',
    };

    if (workflowId) {
      query['workflow_id'] = workflowId;
    }

    if (startTime !== undefined) {
      query['start_time'] = startTime.toString();
    }

    if (endTime !== undefined) {
      query['end_time'] = endTime.toString();
    }

    if (states) {
      query['states'] = states;
    }

    if (orderByTime) {
      query['order_by_time'] = orderByTime;
    }

    if (pageSize !== undefined) {
      query['page_size'] = pageSize.toString();
    }

    if (pageToken) {
      query['page_token'] = pageToken;
    }

    const res = await this.fetchBucket<ListBucketWorkflowExecutionOutput>(
      bucket,
      'GET',
      query,
      {}
    );
    return res;
  } catch (error) {
    return handleEmptyServerError<ListBucketWorkflowExecutionOutput>(error, {
      enableCatchEmptyServerError: this.opts.enableOptimizeMethodBehavior,
      methodKey: 'listBucketWorkflowExecution',
      defaultResponse: {
        Items: [],
      },
    });
  }
}
