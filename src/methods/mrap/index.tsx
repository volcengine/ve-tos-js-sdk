import TOSBase from '../base';
import { AccessPointStatusType } from '../../TosExportEnum';

export interface AccessPoint {
  Name: string; //规则名
  Alias?: string; //别名
  Status: AccessPointStatusType; //状态;
  CreatedAt: number;
  Regions: Array<{
    Bucket: string;
    BucketAccountId: number;
    Region: string;
  }>;
}

export interface CreateMultiRegionAccessPointInput {
  name: string;
  regions: Array<{
    Bucket: string;
    BucketAccountId: string;
  }>;
  accountId: string;
}

export interface CreateMultiRegionAccessPointOutput {}

/**
 * @private unstable method
 */
export async function createMultiRegionAccessPoint(
  this: TOSBase,
  input: CreateMultiRegionAccessPointInput
) {
  const { accountId, name, regions } = input;

  const res = await this.fetch<CreateMultiRegionAccessPointOutput>(
    'POST',
    '/mrap',
    {
      name,
    },
    {
      'x-tos-account-id': accountId,
    },
    {
      Name: name,
      Regions: regions,
    },
    {}
  );

  return res;
}

export interface GetMultiRegionAccessPointInput {
  name: string;
  accountId: string;
}

export interface GetMultiRegionAccessPointOutput extends AccessPoint {}

/**
 * @private unstable method
 */
export async function getMultiRegionAccessPoint(
  this: TOSBase,
  input: GetMultiRegionAccessPointInput
) {
  const { name, accountId } = input;
  const res = await this.fetch<GetMultiRegionAccessPointOutput>(
    'GET',
    '/mrap',
    {
      name,
    },
    {
      'x-tos-account-id': accountId,
    },
    {},
    {}
  );

  return res;
}

export interface ListMultiRegionAccessPointsInput {
  accountId: string;
  maxResults?: number;
  nextToken?: string;
}

export interface ListMultiRegionAccessPointsOutput {
  AccessPoints: Array<AccessPoint>;
  NextToken?: string;
}

/**
 * @private unstable method
 */
export async function listMultiRegionAccessPoints(
  this: TOSBase,
  input: ListMultiRegionAccessPointsInput
) {
  const { accountId, ...nextQuery } = input;
  const res = await this.fetch<ListMultiRegionAccessPointsOutput>(
    'GET',
    '/mrap',
    { ...nextQuery },
    {
      'x-tos-account-id': accountId,
    },
    {},
    {}
  );

  return res;
}

export interface GetMultiRegionAccessPointRoutesInput {
  accountId: string;
  alias: string;
}

export interface AccessPointRoute {
  Bucket: string;
  Region: string;
  TrafficDialPercentage: number;
}

export interface GetMultiRegionAccessPointRoutesOutput {
  Routes?: AccessPointRoute[];
  Alias?: string;
}

/**
 * @private unstable method
 */
export async function getMultiRegionAccessPointRoutes(
  this: TOSBase,
  input: GetMultiRegionAccessPointRoutesInput
) {
  const { accountId, alias } = input;
  const res = await this.fetch<GetMultiRegionAccessPointRoutesOutput>(
    'GET',
    '/mrap/routes',
    {
      alias,
    },
    {
      'x-tos-account-id': accountId,
    }
  );
  return res;
}

export interface DeleteMultiRegionAccessPointInput {
  accountId: string;
  name: string;
}

export interface DeleteMultiRegionAccessPointOutput {}

export async function deleteMultiRegionAccessPoint(
  this: TOSBase,
  input: DeleteMultiRegionAccessPointInput
) {
  const { name, accountId } = input;
  const res = await this.fetch<DeleteMultiRegionAccessPointOutput>(
    'DELETE',
    '/mrap',
    {
      name,
    },
    {
      'x-tos-account-id': accountId,
    }
  );
  return res;
}

export interface SubmitMultiRegionAccessPointRoutesInput {
  accountId: string;
  alias: string;
  routes: AccessPointRoute[];
}

export interface SubmitMultiRegionAccessPointRoutesOutput {}

export async function submitMultiRegionAccessPointRoutes(
  this: TOSBase,
  input: SubmitMultiRegionAccessPointRoutesInput
) {
  const { routes, accountId, alias } = input;
  const res = await this.fetch<SubmitMultiRegionAccessPointRoutesOutput>(
    'PATCH',
    '/mrap/routes',
    {
      alias,
    },
    {
      'x-tos-account-id': accountId,
    },
    {
      Routes: routes,
    }
  );
  return res;
}


export interface BindAcceleratorWithMultiRegionAccessPointInput {
  AccountId: string;
  MultiRegionAccessPointAlias: string;
  AcceleratorId: string;
}

export interface BindAcceleratorWithMultiRegionAccessPointOutput {}

/**
 * @private unstable method
 */
export async function bindAcceleratorWithMultiRegionAccessPoint(
  this: TOSBase,
  input: BindAcceleratorWithMultiRegionAccessPointInput
) {
  const { AccountId, MultiRegionAccessPointAlias, AcceleratorId } = input;

  const res = await this.fetch<BindAcceleratorWithMultiRegionAccessPointOutput>(
    'PUT',
    `/accelerator/${AcceleratorId}/mrap/${MultiRegionAccessPointAlias}`,
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

export interface UnbindAcceleratorWithMultiRegionAccessPointInput {
  AccountId: string;
  MultiRegionAccessPointAlias: string;
  AcceleratorId: string;
}

export interface UnbindAcceleratorWithMultiRegionAccessPointOutput {}

/**
 * @private unstable method
 */
export async function unbindAcceleratorWithMultiRegionAccessPoint(
  this: TOSBase,
  input: UnbindAcceleratorWithMultiRegionAccessPointInput
) {
  const { AccountId, MultiRegionAccessPointAlias, AcceleratorId } = input;

  const res = await this.fetch<UnbindAcceleratorWithMultiRegionAccessPointOutput>(
    'DELETE',
    `/accelerator/${AcceleratorId}/mrap/${MultiRegionAccessPointAlias}`,
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

export interface ListBindAccessPointForMultiRegionAcceleratorInput {
  AccountId: string;
  AcceleratorId: string;
}

export interface ListBindAccessPointForMultiRegionAcceleratorOutput {
  AccessPoints: Array<{ Alias: string; Endpoint: string }>
}

/**
 * @private unstable method
 */
export async function listBindAccessPointForMultiRegionAccelerator(
  this: TOSBase,
  input: ListBindAccessPointForMultiRegionAcceleratorInput
) {
  const { AccountId, AcceleratorId } = input;

  const res = await this.fetch<ListBindAccessPointForMultiRegionAcceleratorOutput>(
    'GET',
    `/accelerator/${AcceleratorId}/mrap`,
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