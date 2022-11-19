import TosClientError from '../../TosClientError';
import { obj2QueryStr } from '../../utils';
import TOSBase from '../base';

export interface PreSignedPolicyURLInput {
  bucket?: string;
  /**
   * unit: s
   * default value: 3600
   * range is: [1, 604800]
   */
  expires?: number;

  conditions: PolicySignatureCondition[];

  alternativeEndpoint?: string;
}

export interface PreSignedPolicyURLOutput {
  getSignedURLForList(additionalQuery?: Record<string, string>): string;

  // since conditions maybe includes multi exact key, so key isn't predictable
  getSignedURLForGetOrHead(
    key: string,
    additionalQuery?: Record<string, string>
  ): string;

  signedQuery: string;
}

export interface PolicySignatureCondition {
  key: 'key';
  value: string;
  operator?: 'eq' | 'starts-with';
}

interface NormalizedInput {
  bucket: string;
  /**
   * unit: s
   * default value: 3600
   * range is: [1, 604800]
   */
  expires: number;

  conditions: NormalizedPolicySignatureCondition[];

  alternativeEndpoint?: string;
}

type NormalizedPolicySignatureCondition = [
  'eq' | 'starts-with',
  '$key' | '$bucket',
  string
];

export function preSignedPolicyURL(
  this: TOSBase,
  input: PreSignedPolicyURLInput
): PreSignedPolicyURLOutput {
  const normalizedInput = normalizeInput.call(this, input);

  validateConditions(input.conditions);

  const endpoint =
    input.alternativeEndpoint ||
    `${normalizedInput.bucket}.${this.opts.endpoint}`;

  const baseURL = `http${this.opts.secure ? 's' : ''}://${endpoint}`;

  const query = this.getSignatureQuery({
    bucket: normalizedInput.bucket,
    expires: normalizedInput.expires,
    policy: {
      conditions: normalizedInput.conditions,
    },
  });

  const queryStr = obj2QueryStr(query);

  const getSignedURLForList: PreSignedPolicyURLOutput['getSignedURLForList'] = additionalQuery => {
    const str2 = obj2QueryStr(additionalQuery);
    const q = [queryStr, str2].filter(Boolean).join('&');
    return `${baseURL}?${q}`;
  };
  const getSignedURLForGetOrHead: PreSignedPolicyURLOutput['getSignedURLForGetOrHead'] = (
    key,
    additionalQuery
  ) => {
    const str2 = obj2QueryStr(additionalQuery);
    const q = [queryStr, str2].filter(Boolean).join('&');
    const keyPath = encodeURIComponent(key);
    return `${baseURL}/${keyPath}?${q}`;
  };
  return {
    getSignedURLForList,
    getSignedURLForGetOrHead,
    signedQuery: queryStr,
  };
}

function normalizeInput(
  this: TOSBase,
  input: PreSignedPolicyURLInput
): NormalizedInput {
  const actualBucket = input.bucket || this.opts.bucket;
  const defaultExpires = 3600;

  if (!actualBucket) {
    throw new TosClientError('Must provide bucket param');
  }

  validateConditions(input.conditions);
  const normalizedConditions: NormalizedPolicySignatureCondition[] = input.conditions.map(
    it => [it.operator || 'eq', '$key', it.value]
  );
  normalizedConditions.push(['eq', '$bucket', actualBucket]);

  return {
    bucket: actualBucket,
    expires: input.expires || defaultExpires,
    conditions: normalizedConditions,
  };
}

function validateConditions(conditions: PolicySignatureCondition[]) {
  if (conditions.length < 1) {
    throw new TosClientError(
      'The `conditions` field of `PreSignedPolicyURLInput` must has one item at least'
    );
  }

  for (const it of conditions) {
    if (it.key !== 'key') {
      throw new TosClientError(
        "The `key` field of `PolicySignatureCondition` must be `'key'`"
      );
    }

    if (it.operator && it.operator !== 'eq' && it.operator !== 'starts-with') {
      throw new TosClientError(
        "The `operator` field of `PolicySignatureCondition` must be `'eq'` or `'starts-with'`"
      );
    }
  }
}
