import TOSBase from '../base';
import {
  CreateAccessPointInput,
  CreateAccessPointOutput,
  GetAccessPointInput,
  GetAccessPointOutput,
  DeleteAccessPointInput,
  DeleteAccessPointOutput,
  ListAccessPointsInput,
  ListAccessPointsOutput,
  BindAcceleratorWithAccessPointInput,
  BindAcceleratorWithAccessPointOutput,
  UnbindAcceleratorWithAccessPointInput,
  UnbindAcceleratorWithAccessPointOutput,
  ListBindAccessPointForAcceleratorInput,
  ListBindAccessPointForAcceleratorOutput,
} from './interface';

/**
 * @private unstable method
 */
export async function createAccessPoint(
  this: TOSBase,
  input: CreateAccessPointInput
) {
  const { BucketAccountId, Name, AccountId, Bucket, NetworkOrigin, VpcId } = input;

  const res = await this.fetch<CreateAccessPointOutput>(
    'PUT',
    `/accesspoint/${Name}`,
    {
      name: '',
    },
    {
      'x-tos-account-id': AccountId,
    },
    {
      BucketAccountId,
      Bucket,
      NetworkOrigin,
      VpcId,
    },
    {}
  );

  return res;
}

/**
 * @private unstable method
 */
export async function getAccessPoint(
  this: TOSBase,
  input: GetAccessPointInput
) {
  const { Name, AccountId } = input;
  const res = await this.fetch<GetAccessPointOutput>(
    'GET',
    `/accesspoint/${Name}`,
    {
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
export async function listAccessPoints(
  this: TOSBase,
  input: ListAccessPointsInput
) {
  const { AccountId, ...nextQuery } = input;
  const res = await this.fetch<ListAccessPointsOutput>(
    'GET',
    '/accesspoint',
    { ...nextQuery },
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
export async function deleteAccessPoint(
  this: TOSBase,
  input: DeleteAccessPointInput
) {
  const { Name, AccountId } = input;
  const res = await this.fetch<DeleteAccessPointOutput>(
    'DELETE',
    `/accesspoint/${Name}`,
    {
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
export async function bindAcceleratorWithAccessPoint(
  this: TOSBase,
  input: BindAcceleratorWithAccessPointInput
) {
  const { AccountId, AcceleratorAccountId, AccessPointName, AcceleratorId } = input;

  const res = await this.fetch<BindAcceleratorWithAccessPointOutput>(
    'PUT',
    `/accesspoint/${AccessPointName}/accelerator/${AcceleratorId}`,
    {
    },
    {
      'x-tos-account-id': AccountId,
    },
    {
      AcceleratorAccountId,
    },
    {}
  );

  return res;
}

/**
 * @private unstable method
 */
export async function unbindAcceleratorWithAccessPoint(
  this: TOSBase,
  input: UnbindAcceleratorWithAccessPointInput
) {
  const { AccountId, AccessPointName, AcceleratorId } = input;

  const res = await this.fetch<UnbindAcceleratorWithAccessPointOutput>(
    'DELETE',
    `/accesspoint/${AccessPointName}/accelerator/${AcceleratorId}`,
    {
    },
    {
      'x-tos-account-id': AccountId,
    },
    {
    },
    {}
  );

  return res;
}

/**
 * @private unstable method
 */
export async function listBindAccessPointForAccelerator(
  this: TOSBase,
  input: ListBindAccessPointForAcceleratorInput
) {
  const { AccountId, AcceleratorId, ...restQuery } = input;

  const res = await this.fetch<ListBindAccessPointForAcceleratorOutput>(
    'GET',
    `/accelerator/${AcceleratorId}/accesspoint`,
    {
      ...restQuery,
    },
    {
      'x-tos-account-id': AccountId,
    },
    {
    },
    {}
  );

  return res;
}

export * from './interface';
