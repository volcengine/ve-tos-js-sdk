import TOSBase, { TosResponse } from '../base';
import { handleEmptyServerError } from '../../handleEmptyServerError';

export interface StatementItem {
  Sid: string;
  Effect: 'Allow' | 'Deny';
  Action?: string | string[];
  NotAction?: string | string[];
  Condition?: {
    [key in string]: {
      [key in string]: string[];
    };
  };
  Principal?: string[];
  NotPrincipal?: string[];
  Resource?: string | string[];
  NotResource?: string | string[];
}

export interface Policy {
  Version?: string;
  Statement: StatementItem[];
}

export interface PutAccessPointPolicyInput {
  accountId: string;
  name: string;
  policy: Policy;
}

export interface PutAccessPointPolicyOutput {}

/**
 * @private unstable method
 */

export async function putAccessPointPolicy(
  this: TOSBase,
  input: PutAccessPointPolicyInput
) {
  const { accountId, name, policy } = input;
  if (this.opts.enableOptimizeMethodBehavior && !policy.Statement?.length) {
    return deleteAccessPointPolicy.call(this, {
      accountId,
      name,
    });
  }

  return this.fetch<PutAccessPointPolicyOutput>(
    'PUT',
    `/accesspoint/${name}/policy`,
    {},
    {
      'x-tos-account-id': accountId,
    },
    policy
  );
}

export interface GetAccessPointPolicyInput {
  accountId: string;
  name: string;
}

export interface GetAccessPointPolicyOutput {
  Policy: Policy;
}

/**
 * @private unstable method
 */

export async function getAccessPointPolicy(
  this: TOSBase,
  input: GetAccessPointPolicyInput
): Promise<TosResponse<GetAccessPointPolicyOutput>> {
  const { accountId, name } = input;
  try {
    const res = await this.fetch(
      'GET',
      `/accesspoint/${name}/policy`,
      {},
      {
        'x-tos-account-id': accountId,
      },
      undefined,
      {
        handleResponse(response) {
          return {
            Policy: response.data,
          };
        },
      }
    );
    return res as TosResponse<GetAccessPointPolicyOutput>;
  } catch (error) {
    return handleEmptyServerError<GetAccessPointPolicyOutput>(error, {
      enableCatchEmptyServerError: this.opts.enableOptimizeMethodBehavior,
      methodKey: 'getAccessPointPolicy',
      defaultResponse: {
        Policy: {
          Version: '2012-10-17',
          Statement: [],
        },
      },
    });
  }
}

export interface DeleteAccessPointPolicyInput {
  accountId: string;
  name: string;
}

export interface DeleteAccessPointPolicyOutput {}

/**
 * @private unstable method
 */

export async function deleteAccessPointPolicy(
  this: TOSBase,
  input: DeleteAccessPointPolicyInput
) {
  const { accountId, name } = input;
  return this.fetch<DeleteAccessPointPolicyOutput>(
    'DELETE',
    `/accesspoint/${name}/policy`,
    {},
    {
      'x-tos-account-id': accountId,
    }
  );
}

export interface PutMultiRegionAccessPointPolicyInput {
  accountId: string;
  name: string;
  policy: Policy;
}

export interface PutMultiRegionAccessPointPolicyOutput {}

/**
 * @private unstable method
 */

export async function putMultiRegionAccessPointPolicy(
  this: TOSBase,
  input: PutMultiRegionAccessPointPolicyInput
) {
  const { accountId, name, policy } = input;
  if (this.opts.enableOptimizeMethodBehavior && !policy.Statement?.length) {
    return deleteMultiRegionAccessPointPolicy.call(this, {
      accountId,
      name,
    });
  }

  const res = await this.fetch<PutMultiRegionAccessPointPolicyOutput>(
    'PUT',
    `/mrap/${name}/policy`,
    {},
    {
      'x-tos-account-id': accountId,
    },
    policy,
    {}
  );

  return res;
}

export interface GetMultiRegionAccessPointPolicyInput {
  accountId: string;
  name: string;
}

export interface GetMultiRegionAccessPointPolicyOutput {
  Policy: Policy;
}

/**
 * @private unstable method
 */

export async function getMultiRegionAccessPointPolicy(
  this: TOSBase,
  input: GetMultiRegionAccessPointPolicyInput
): Promise<TosResponse<GetMultiRegionAccessPointPolicyOutput>> {
  const { accountId, name } = input;
  try {
    const res = await this.fetch(
      'GET',
      `/mrap/${name}/policy`,
      {},
      {
        'x-tos-account-id': accountId,
      },
      undefined,
      {
        handleResponse(response) {
          return {
            Policy: response.data,
          };
        },
      }
    );
    return res as TosResponse<GetMultiRegionAccessPointPolicyOutput>;
  } catch (error) {
    return handleEmptyServerError<GetMultiRegionAccessPointPolicyOutput>(
      error,
      {
        enableCatchEmptyServerError: this.opts.enableOptimizeMethodBehavior,
        methodKey: 'getMultiRegionAccessPointMirrorBack',
        defaultResponse: {
          Policy: {
            Version: '2012-10-17',
            Statement: [],
          },
        },
      }
    );
  }
}

export interface DeleteMultiRegionAccessPointPolicyInput {
  accountId: string;
  name: string;
}

export interface DeleteMultiRegionAccessPointPolicyOutput {}

/**
 * @private unstable method
 */

export async function deleteMultiRegionAccessPointPolicy(
  this: TOSBase,
  input: DeleteMultiRegionAccessPointPolicyInput
) {
  const { accountId, name } = input;
  const res = await this.fetch<DeleteMultiRegionAccessPointPolicyOutput>(
    'DELETE',
    `/mrap/${name}/policy`,
    {},
    {
      'x-tos-account-id': accountId,
    },
    {},
    {
      handleResponse() {
        return {};
      },
    }
  );
  return res;
}
