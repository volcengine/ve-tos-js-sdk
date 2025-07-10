import {
  FileCompressFlatten,
  FileUncompressPrefixReplaced,
} from '../../TosExportEnum';
import { TOSBase } from '../base';
import { UnionToIntersection, MergeExclusive } from 'type-fest';
import { handleEmptyServerError } from '../../handleEmptyServerError';

export interface ListBucketJobInput {
  bucket?: string;
  jobType: string;
  startTime?: number;
  endTime?: number;
  pageSize?: number;
  pageToken?: string;
}

export interface AudioConvertConfig {
  ContainerFormat?: string;
  BitRate?: number;
}

export interface AudioJobItem {
  JobID: string;
  CreateTime: string;
  StartTime: string;
  EndTime: string;
  State: string;
  Code: number;
  Message?: string;
  Tag: string;
  Input: {
    BucketId: string;
    Object: string;
    Region: string;
  };
  Operation: {
    Output: {
      // 输出
      Bucket: string;
      Object: string;
      Region: string;
    };
  };
  AudioConvertConfig?: AudioConvertConfig;
  Output: {
    // 输出
    Bucket: string;
    Object: string;
    Region: string;
  };
}

export interface FileCompressJobItem {
  JobID: string;
  CreateTime: string;
  StartTime: string;
  EndTime: string;
  State: string;
  Code: number;
  Error: string;
  Message: string;
  Input: MergeExclusive<
    {
      Prefix: string;
    },
    {
      KeyConfig: Array<{ Key: string }>;
    }
  >;
  Operation: {
    FileCompressConfig: {
      Flatten: FileCompressFlatten | number;
      Format: string;
    };
    FileCompressResult: {
      Bucket: string;
      CompressFileCount: number;
      ErrorCount: number;
      ErrorDetail?: {
        ErrorFile: any[];
      };
      Object: string;
      Region: string;
    };
    Output: {
      Bucket: string;
      Object: string;
      Region: string;
    };
  };
  Tag: string;
}

export interface FileUncompressJobItem {
  JobID: string;
  CreateTime: string;
  StartTime: string;
  EndTime: string;
  State: string;
  Code: number;
  Message: string;
  Error: string;
  Input: {
    Object: string;
  };
  Operation: {
    FileUncompressConfig: {
      Prefix: string;
      /**
       * @default 0 FileUncompressPrefixReplaced.NoExtraPrefix
       */
      PrefixReplaced?: FileUncompressPrefixReplaced | number;
    };
    FileUncompressResult: {
      Bucket: string;
      FileCount: number;
      FileList: {
        Contents: any[];
        IsTruncated: boolean;
      };
      Region: string;
    };
    Output: {
      Bucket: string;
      Object: string;
      Region: string;
    };
  };
  Tag: string;
}

export type BucketJobItem = UnionToIntersection<
  AudioJobItem | FileCompressJobItem | FileUncompressJobItem
>;

export interface ListBucketJobOutput {
  Items: BucketJobItem[];
  NextPageToken?: string;
  JobType: string;
}

/**
 * @private unstable method
 */
export async function listBucketJob(this: TOSBase, input: ListBucketJobInput) {
  const { bucket, jobType, startTime, endTime, pageSize, pageToken } = input;
  const query: Record<string, string> = {
    job_type: jobType,
  };
  if (startTime !== undefined) {
    query['start_time'] = startTime.toString();
  }

  if (endTime !== undefined) {
    query['end_time'] = endTime.toString();
  }

  if (pageSize !== undefined) {
    query['page_size'] = pageSize.toString();
  }

  if (pageToken !== undefined) {
    query['page_token'] = pageToken;
  }

  const res = await this.fetchBucket<ListBucketJobOutput>(
    bucket,
    'GET',
    query,
    {}
  );
  return res;
}

export interface GetBucketJobInput {
  bucket?: string;
  jobType: string;
  jobId: string;
}

export type GetBucketJobOutput = BucketJobItem | null;

/**
 * @private unstable method
 */
export async function getBucketJob(this: TOSBase, input: GetBucketJobInput) {
  const { bucket, jobType, jobId } = input;
  try {
    const res = await this.fetchBucket<GetBucketJobOutput>(
      bucket,
      'GET',
      {
        job_type: jobType,
        job_id: jobId,
      },
      {}
    );
    return res;
  } catch (error) {
    return handleEmptyServerError<GetBucketJobOutput>(error, {
      enableCatchEmptyServerError: this.opts.enableOptimizeMethodBehavior,
      methodKey: 'getBucketJob',
      defaultResponse: null,
    });
  }
}
