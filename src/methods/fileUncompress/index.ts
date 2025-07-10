import TosServerError from '../../TosServerError';
import TOSBase, { TosResponse } from '../base';
import { FileUncompressPrefixReplaced } from '../../TosExportEnum'; // 新增导入

export interface CreateFileUncompressInput {
  bucket: string;
  Input: {
    Object: string;
  };
  FileUncompressConfig: {
    Prefix: string;
    /**
     * @default 0 FileUncompressPrefixReplaced.NoExtraPrefix
     */
    PrefixReplaced?: FileUncompressPrefixReplaced | number;
  };
  Output: {
    Region: string;
    Bucket: string;
  };
}

export interface CreateFileUncompressOutput {
  Code: string;
  Message: string;
  JobId: string;
}

/**
 * @private unstable method
 */
export async function createFileUncompress(
  this: TOSBase,
  req: CreateFileUncompressInput
): Promise<TosResponse<CreateFileUncompressOutput>> {
  const { bucket, Input, FileUncompressConfig, Output } = req;
  const res = await this.fetchBucket<CreateFileUncompressOutput>(
    bucket,
    'POST',
    {
      file_jobs: '',
      job_type: 'FileUncompress',
    },
    {},
    { Input, FileUncompressConfig, Output }
  );
  return res;
}
