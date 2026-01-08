import TOSBase from '../base';
import { filterUndefined } from '../utils';
import {
  CreateAnyPrivateAccessPointInput,
  CreateAnyPrivateAccessPointOutput,
  ListAnyPrivateAccessPointsInput,
  ListAnyPrivateAccessPointsOutput,
  ListAnyPrivateAccessPointSupportAzInput,
  ListAnyPrivateAccessPointSupportAzOutput,
  ListAnyPrivateAccessPointEndpointsInput,
  ListAnyPrivateAccessPointEndpointsOutput,
} from './interface';

/**
 * @private unstable method
 */
export async function putAnyPrivateAccessPoint(
  this: TOSBase,
  input: CreateAnyPrivateAccessPointInput
) {
  const { Name, AccountId, VpcId, Subnets, SecurityGroupId } = input;
  const res = await this.fetch<CreateAnyPrivateAccessPointOutput>(
    'PUT',
    `/apap`,
    {name: Name},
    {
      'x-tos-account-id': AccountId,
    },
    filterUndefined({
      Name,
      VpcId,
      Subnets,
      SecurityGroupId,
    }),
  );
  return res;
}

/**
 * @private unstable method
 */
export async function listAnyPrivateAccessPoints(
  this: TOSBase,
  input: ListAnyPrivateAccessPointsInput
) {
  const { AccountId, ...nextQuery } = input;
  const res = await this.fetch<ListAnyPrivateAccessPointsOutput>(
    'GET',
    '/apap',
    filterUndefined(nextQuery),
    {
      'x-tos-account-id': AccountId,
    },
  );
  return res;
}

/**
 * @private unstable method
 */
export async function listAnyPrivateAccessPointSupportAz(
  this: TOSBase,
  input: ListAnyPrivateAccessPointSupportAzInput
) {
  const { AccountId } = input;
  const res = await this.fetch<ListAnyPrivateAccessPointSupportAzOutput>(
    'GET',
    '/apap/az',
    {},
    {
      'x-tos-account-id': AccountId,
    },
  );
  return res;
}

/**
 * @private unstable method
 */
export async function listAnyPrivateAccessPointEndpoints(
  this: TOSBase,
  input: ListAnyPrivateAccessPointEndpointsInput
) {
  const { AccountId } = input;
  const res = await this.fetch<ListAnyPrivateAccessPointEndpointsOutput>(
    'GET',
    '/apap/endpoint',
    {},
    {
      'x-tos-account-id': AccountId,
    },
  );
  return res;
}


export * from './interface';

