import TOSBase, { TosResponse } from '../base';
import { FileCompressFlatten } from '../../TosExportEnum'; // 新增导入

export interface CreateFileCompressInput {
  bucket: string;
  Input: {
    Prefix?: string;
    KeyConfig?: { Key: string }[];
  };
  FileCompressConfig: {
    //only support zip
    Format: string;
    Flatten: FileCompressFlatten | number;
  };
  Output: {
    Region: string;
    Bucket: string;
    Object: string;
  };
}

export interface CreateFileCompressOutput {
  Code: string;
  Message: string;
  JobId: string;
}

/**
 * @private unstable method
 */
export async function createFileCompress(
  this: TOSBase,
  req: CreateFileCompressInput
): Promise<TosResponse<CreateFileCompressOutput>> {
  const { bucket, Input, FileCompressConfig, Output } = req;
  const res = await this.fetchBucket<CreateFileCompressOutput>(
    bucket,
    'POST',
    {
      file_jobs: '',
      job_type: 'FileCompress',
    },
    {},
    { Input, FileCompressConfig, Output }
  );
  return res;
}
