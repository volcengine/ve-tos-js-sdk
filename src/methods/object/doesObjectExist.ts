
import TosClientError from '../../TosClientError';
import TosServerError from '../../TosServerError';
import TOSBase from '../base';
import { headObject } from './headObject';

export interface DoesObjectExistInput {
  bucket?: string;
  key: string;
  versionId?: string;
}

export async function doesObjectExist(
  this: TOSBase,
  input: DoesObjectExistInput
): Promise<boolean> {
  if (!input) {
    throw new TosClientError('input is required');
  }

  try {
    const res = await headObject.call(this, {
      bucket: input.bucket,
      key: input.key,
      versionId: input.versionId,
    });
    return res.statusCode === 200;
  } catch (err) {
    if (err instanceof TosServerError) {
      if (err.statusCode === 404) {
        return false;
      }
    }
    throw err;
  }
}
