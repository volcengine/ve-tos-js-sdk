import TOSBase from '../base';
import { MRAPMirrorBackRedirectPolicyType } from '../../TosExportEnum';
import { makeArrayProp } from '../../utils';
import { handleEmptyServerError } from '../../handleEmptyServerError';

export interface MirrorBackRule {
  ID?: string;
  Status: 'Enabled' | 'Disabled';
  Condition?: {
    HttpCode?: number[];
    KeyPrefix?: string[];
  };
  Redirect?: {
    RedirectPolicy: MRAPMirrorBackRedirectPolicyType;
  };
}

export interface PutMultiRegionAccessPointMirrorBackInput {
  accountId: string;
  alias: string;
  rules: MirrorBackRule[];
}

export interface PutMultiRegionAccessPointMirrorBackOutput {}

/**
 * @private unstable method
 */
export const putMultiRegionAccessPointMirrorBack = async function (
  this: TOSBase,
  input: PutMultiRegionAccessPointMirrorBackInput
) {
  const { accountId, alias, rules } = input;

  if (this.opts.enableOptimizeMethodBehavior && !rules.length) {
    return deleteMultiRegionAccessPointMirrorBack.call(this, {
      accountId,
      alias,
    });
  }

  const res = await this.fetch<PutMultiRegionAccessPointMirrorBackOutput>(
    'PUT',
    '/mrap/mirror',
    {
      alias,
    },
    {
      'x-tos-account-id': accountId,
    },
    {
      Rules: rules,
    },
    {
      handleResponse() {
        return {};
      },
    }
  );
  return res;
};

export interface GetMultiRegionAccessPointMirrorBackInput {
  accountId: string;
  alias: string;
}

export interface GetMultiRegionAccessPointMirrorBackOutput {
  Rules: MirrorBackRule[];
}

/**
 * @private unstable method
 */
export const getMultiRegionAccessPointMirrorBack = async function (
  this: TOSBase,
  input: GetMultiRegionAccessPointMirrorBackInput
) {
  const { accountId, alias } = input;
  try {
    const res = await this.fetch<GetMultiRegionAccessPointMirrorBackOutput>(
      'GET',
      '/mrap/mirror',
      {
        alias,
      },
      {
        'x-tos-account-id': accountId,
      },
      {},
      {}
    );
    const arrayProp = makeArrayProp(res.data);
    arrayProp('Rules');
    return res;
  } catch (error) {
    return handleEmptyServerError<GetMultiRegionAccessPointMirrorBackOutput>(
      error,
      {
        enableCatchEmptyServerError: this.opts.enableOptimizeMethodBehavior,
        methodKey: 'getMultiRegionAccessPointMirrorBack',
        defaultResponse: {
          Rules: [],
        },
      }
    );
  }
};

export interface DeleteMultiRegionAccessPointMirrorBackInput {
  accountId: string;
  alias: string;
}
export interface DeleteMultiRegionAccessPointMirrorBackOutput {}

/**
 * @private unstable method
 */
export const deleteMultiRegionAccessPointMirrorBack = async function (
  this: TOSBase,
  input: DeleteMultiRegionAccessPointMirrorBackInput
) {
  const { accountId, alias } = input;
  const res = await this.fetch<DeleteMultiRegionAccessPointMirrorBackOutput>(
    'DELETE',
    '/mrap/mirror',
    {
      alias,
    },
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
};
