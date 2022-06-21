import TOSBase from '../base';
import { parse, stringify, hmacSha256 } from '../../universal/crypto';

export type PostSignatureCondition =
  | {
      [key: string]: string;
    }
  | ['eq', string, string]
  | ['starts-with', string, string]
  | ['content-length-range', number, number];

export interface CalculatePostSignatureInput {
  bucket?: string;
  key: string;
  // unit: seconds, default: 3600(1 hour)
  expiresIn?: number;
  fields?: Record<string, unknown>;
  conditions?: PostSignatureCondition[];
}

export async function calculatePostSignature(
  this: TOSBase,
  input: CalculatePostSignatureInput
) {
  const { expiresIn = 3600, key } = input;
  const bucket = input.bucket || this.opts.bucket;
  const fields = { ...input.fields };
  const conditions = [...(input.conditions || [])];

  if (!bucket) {
    throw Error('Must provide bucket param');
  }

  const accessKeySecret = this.opts.accessKeySecret;
  const date = new Date();
  const expirationDateStr = getDateTimeStr({
    date: new Date(date.valueOf() + expiresIn * 1000),
    type: 'ISO',
  });
  const dateStr = getDateTimeStr();
  const date8Str = dateStr.substring(0, 8);
  const service = 'tos';
  const requestStr = 'request';

  const kDate = hmacSha256(accessKeySecret, date8Str);
  const kRegion = hmacSha256(kDate, this.opts.region);
  const kService = hmacSha256(kRegion, service);
  const signingKey = hmacSha256(kService, requestStr);

  const credential = [
    this.opts.accessKeyId,
    date8Str,
    this.opts.region,
    service,
    requestStr,
  ].join('/');

  const addedInForm: Record<string, string> = {
    key,
    'x-tos-algorithm': 'TOS4-HMAC-SHA256',
    'x-tos-date': dateStr,
    'x-tos-credential': credential,
  };
  if (this.opts.stsToken) {
    addedInForm['x-tos-security-token'] = this.opts.stsToken;
  }

  conditions.push({ bucket });
  Object.entries(addedInForm).forEach(([key, value]) => {
    fields[key] = value;
    conditions.push({ [key]: value });
  });

  const policy = {
    expiration: expirationDateStr,
    conditions,
  };
  const policyStr = JSON.stringify(policy);
  const policyBase64 = stringify(parse(policyStr, 'utf-8'), 'base64');
  const signature = hmacSha256(signingKey, policyBase64, 'hex');

  fields.policy = policyBase64;
  fields['x-tos-signature'] = signature;

  return fields;
}

/**
 *
 * Z for 20130728T000000Z
 * ISO for 2007-12-01T12:00:00.000Z
 * @param opt
 * @returns
 */
function getDateTimeStr(opt?: { date?: Date; type?: 'Z' | 'ISO' }) {
  const { date = new Date(), type = 'Z' } = opt || {};
  if (type === 'ISO') {
    return date.toISOString();
  }

  const dateTime =
    date
      .toISOString()
      .replace(/\..+/, '')
      .replace(/-/g, '')
      .replace(/:/g, '') + 'Z';

  return dateTime;
}

export default calculatePostSignature;
