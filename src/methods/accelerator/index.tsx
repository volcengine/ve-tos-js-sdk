import TOSBase from '../base';
import {
  PutAcceleratorInput,
  PutAcceleratorOutput,
  GetAcceleratorInput,
  GetAcceleratorOutput,
  DeleteAcceleratorInput,
  DeleteAcceleratorOutput,
  ListAcceleratorsInput,
  ListAcceleratorsOutput,
  ListAcceleratorAzsInput,
  ListAcceleratorAzsOutput,
  PutAcceleratorPrefetchJobInput,
  PutAcceleratorPrefetchJobOutput,
  GetAcceleratorPrefetchJobInput,
  GetAcceleratorPrefetchJobOutput,
  DeleteAcceleratorPrefetchJobInput,
  DeleteAcceleratorPrefetchJobOutput,
  ListAcceleratorPrefetchJobsInput,
  ListAcceleratorPrefetchJobsOutput,
  ListAcceleratorPrefetchJobRecordsInput,
  ListAcceleratorPrefetchJobRecordsOutput
} from './interface';

/**
 * @private unstable method
 */
export async function putAccelerator(
  this: TOSBase,
  input: PutAcceleratorInput
) {
  const { AccountId, ...Accelerator } = input;

  const res = await this.fetch<PutAcceleratorOutput>(
    'POST',
    '/accelerator',
    {
      name: '',
    },
    {
      'x-tos-account-id': AccountId,
    },
    {
      ...Accelerator
    },
    {}
  );

  return res;
}

/**
 * @private unstable method
 */
export async function getAccelerator(
  this: TOSBase,
  input: GetAcceleratorInput
) {
  const { Id, AccountId } = input;
  const res = await this.fetch<GetAcceleratorOutput>(
    'GET',
    '/accelerator',
    {
      id: Id,
    },
    {
      'x-tos-account-id': AccountId,
    },
    {},
    {}
  );

  return res;
}

/**
 * @private unstable method
 */
export async function listAccelerators(
  this: TOSBase,
  input: ListAcceleratorsInput
) {
  const { AccountId, ...restQuery } = input;
  const res = await this.fetch<ListAcceleratorsOutput>(
    'GET',
    '/accelerator',
    { ...restQuery },
    {
      'x-tos-account-id': AccountId,
    },
    {},
    {}
  );

  return res;
}

/**
 * @private unstable method
 */
export async function deleteAccelerator(
  this: TOSBase,
  input: DeleteAcceleratorInput
) {
  const { Id, AccountId } = input;
  const res = await this.fetch<DeleteAcceleratorOutput>(
    'DELETE',
    '/accelerator',
    {
      id: Id,
    },
    {
      'x-tos-account-id': AccountId,
    }
  );
  return res;
}

/**
 * @private unstable method
 */
export async function listAcceleratorAzs(
  this: TOSBase,
  input: ListAcceleratorAzsInput
) {
  const { AccountId, ...restQuery } = input;
  const res = await this.fetch<ListAcceleratorAzsOutput>(
    'GET',
    '/accelerator/az',
    { ...restQuery },
    {
      'x-tos-account-id': AccountId,
    },
    {},
    {}
  );

  return res;
}

/**
 * @private unstable method
 */
export async function putAcceleratorPrefetchJob(
  this: TOSBase,
  input: PutAcceleratorPrefetchJobInput
) {
  const { AccountId, ...restParams } = input;

  const res = await this.fetch<PutAcceleratorPrefetchJobOutput>(
    'POST',
    '/accelerator/prefetchJob',
    {
      acceleratorId: restParams.AcceleratorId,
    },
    {
      'x-tos-account-id': AccountId,
    },
    {
      ...restParams
    },
    {}
  );

  return res;
}

/**
 * @private unstable method
 */
export async function getAcceleratorPrefetchJob(
  this: TOSBase,
  input: GetAcceleratorPrefetchJobInput
) {
  const { AccountId, JobId } = input;
  const res = await this.fetch<GetAcceleratorPrefetchJobOutput>(
    'GET',
    '/accelerator/prefetchJob',
    {
      jobId: JobId,
    },
    {
      'x-tos-account-id': AccountId,
    },
    {},
    {}
  );

  return res;
}

/**
 * @private unstable method
 */
export async function deleteAcceleratorPrefetchJob(
  this: TOSBase,
  input: DeleteAcceleratorPrefetchJobInput
) {
  const { JobId, AccountId } = input;
  const res = await this.fetch<DeleteAcceleratorPrefetchJobOutput>(
    'DELETE',
    '/accelerator/prefetchJob',
    {
      jobId: JobId,
    },
    {
      'x-tos-account-id': AccountId,
    }
  );
  return res;
}

/**
 * @private unstable method
 */
export async function listAcceleratorPrefetchJobs(
  this: TOSBase,
  input: ListAcceleratorPrefetchJobsInput
) {
  const { AccountId, AcceleratorId, ...restQuery } = input;
  const res = await this.fetch<ListAcceleratorPrefetchJobsOutput>(
    'GET',
    '/accelerator/prefetchJob',
    { acceleratorId: AcceleratorId, ...restQuery },
    {
      'x-tos-account-id': AccountId,
    },
    {},
    {}
  );

  return res;
}

/**
 * @private unstable method
 */
export async function listAcceleratorPrefetchJobRecords(
  this: TOSBase,
  input: ListAcceleratorPrefetchJobRecordsInput
) {
  const { AccountId, JobId, ...restQuery } = input;
  const res = await this.fetch<ListAcceleratorPrefetchJobRecordsOutput>(
    'GET',
    '/accelerator/prefetchRecord',
    {  jobId: JobId, ...restQuery },
    {
      'x-tos-account-id': AccountId,
    },
    {},
    {}
  );

  return res;
}
