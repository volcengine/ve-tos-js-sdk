import { TierType } from '../../TosExportEnum';
import { convertNormalCamelCase2Upper } from '../../utils';
import TOSBase from '../base';

export interface RestoreObjectInput {
  bucket?: string;
  key: string;
  versionId?: string;
  days: number;
  restoreJobParameters?: {
    Tier: TierType;
  };
}

export async function restoreObject(this: TOSBase, input: RestoreObjectInput) {
  const { bucket, key, versionId, ...otherProps } = input;
  const query: Record<string, any> = { restore: '' };
  if (versionId) {
    query.versionId = versionId;
  }
  const body = convertNormalCamelCase2Upper(otherProps);

  return this._fetchObject<undefined>(input, 'POST', query, {}, body);
}

export default restoreObject;
