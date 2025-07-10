import TOSBase from '../base';
import { handleEmptyServerError } from '../../handleEmptyServerError';

export interface PutObjectRetentionInput {
  bucket?: string;
  key: string;
  versionId?: string;
  mode: 'COMPLIANCE';
  retainUntilDate: string;
}

export interface PutObjectRetentionOutput {}

/**
 * @private unstable method
 */
export async function putObjectRetention(
  this: TOSBase,
  input: PutObjectRetentionInput
) {
  const { versionId, mode, retainUntilDate } = input;
  const query: Record<string, any> = { retention: '' };
  if (versionId) {
    query.versionId = versionId;
  }
  return this._fetchObject<PutObjectRetentionOutput>(
    input,
    'PUT',
    query,
    {},
    {
      Mode: mode,
      RetainUntilDate: retainUntilDate,
    }
  );
}

export interface GetObjectRetentionInput {
  bucket?: string;
  key: string;
  versionId?: string;
}

export interface GetObjectRetentionOutput {
  Mode?: string;
  RetainUntilDate?: string;
}

/**
 * @private unstable method
 */
export async function getObjectRetention(
  this: TOSBase,
  input: GetObjectRetentionInput
) {
  const { versionId } = input;
  const query: Record<string, any> = { retention: '' };
  if (versionId) {
    query.versionId = versionId;
  }
  try {
    const res = await this._fetchObject<GetObjectRetentionOutput>(
      input,
      'GET',
      query,
      {}
    );
    return res;
  } catch (error) {
    return handleEmptyServerError<GetObjectRetentionOutput>(error, {
      enableCatchEmptyServerError: this.opts.enableOptimizeMethodBehavior,
      methodKey: 'getObjectRetention',
      defaultResponse: {},
    });
  }
}
