import TOSBase from "../base";
import { ConvertJobOutput } from "./mediaJob";

export interface WorkflowExtFilter {
  AudioExts?: string[];
  VideoExts?: string[];
}

export interface OperationsAudioTranscode {
  OperationID: string;
  TemplateID?: string;
  Output: ConvertJobOutput;
}

export interface OperationsTranscode {
  OperationID: string;
  TemplateID: string;
  Output: ConvertJobOutput;
}

export interface WorkflowOperations {
  AudioTranscode?: OperationsAudioTranscode[];
  Transcode?: OperationsTranscode[];
}

export interface ConvertWorkflowRule {
  ID: string;
  Enabled?: boolean;
  Prefix?: string;
  ExtFilter?: WorkflowExtFilter;
  Topology: string[][];
  Operations: WorkflowOperations;
}

export interface PutConvertWorkflowInput {
  bucket?: string;
  rules: ConvertWorkflowRule[];
}

export interface PutConvertWorkflowOutput {}

export interface GetConvertWorkflowInput {
  bucket?: string;
}

export interface GetConvertWorkflowOutput {
  Rules: ConvertWorkflowRule[];
}

/**
 * @private unstable method
 */
export async function putConvertWorkflow(
  this: TOSBase,
  input: PutConvertWorkflowInput
) {
  const { bucket, rules } = input;

  return this.fetchBucket<PutConvertWorkflowOutput>(
    bucket,
    'PUT',
    {
      workflow: '',
    },
    {},
    {
      Rules: rules,
    }
  );
}

/**
 * @private unstable method
 */
export async function getConvertWorkflow(
  this: TOSBase,
  input: GetConvertWorkflowInput
) {
  const { bucket } = input;

  return this.fetchBucket<GetConvertWorkflowOutput>(
    bucket,
    'GET',
    {
      workflow: '',
    },
    {}
  );
}

export interface DeleteConvertWorkflowInput {
  bucket?: string;
}

export interface DeleteConvertWorkflowOutput {}

/**
 * @private unstable method
 */
export async function deleteConvertWorkflow(
  this: TOSBase,
  input: DeleteConvertWorkflowInput
) {
  const { bucket } = input;
  
  const query: Record<string, any> = {
    workflow: '',
  };
  
  const res = await this.fetchBucket<DeleteConvertWorkflowOutput>(
    bucket,
    'DELETE',
    query,
    {}
  );
  
  if (!res.data) {
    res.data = {};
  }
  
  return res;
}
