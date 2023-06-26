import { handleEmptyServerError } from '../../utils';
import TOSBase, { TosResponse } from '../base';

export interface BucketIntelligenttieringOutput {
  Status?: 'Enabled' | 'Disabled';
  Transitions?: {
    Days: number;
    AccessTier: 'INFREQUENT' | 'ARCHIVEFR';
  }[];
}

export async function getBucketIntelligenttiering(
  this: TOSBase,
  bucket?: string
): Promise<TosResponse<BucketIntelligenttieringOutput>> {
  try {
    const res = await this.fetchBucket<BucketIntelligenttieringOutput>(
      bucket,
      'GET',
      { intelligenttiering: '' },
      {}
    );
    return res;
  } catch (error) {
    return handleEmptyServerError<BucketIntelligenttieringOutput>(error, {});
  }
}
