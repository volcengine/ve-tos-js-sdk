import { covertCamelCase2Kebab, makeArrayProp } from '../../../utils';
import TOSBase from '../../base';

export interface ListMultipartUploadsInput {
  bucket?: string;
  maxUploads?: number;
  keyMarker?: string;
  uploadIdMarker?: string;
  delimiter?: string;
  encodingType?: string;
  prefix?: string;
}

export interface ListMultipartUploadsOutput {
  Uploads: {
    Key: string;
    UploadId: string;
    StorageClass: string;
    Initiated: string;
  }[];
  CommonPrefixes: string[];
  Delimiter?: string;
  EncodingType?: string;
  KeyMarker?: string;
  NextKeyMarker: string;
  MaxUploads?: string;
  UploadIdMarker?: string;
  NextUploadIdMarker: string;
  Prefix?: string;
  IsTruncated: boolean;
  Bucket: string;
}

export async function listMultipartUploads(
  this: TOSBase,
  input: ListMultipartUploadsInput = {}
) {
  const { bucket, ...nextQuery } = input;
  const ret = await this.fetchBucket<ListMultipartUploadsOutput>(
    input.bucket,
    'GET',
    {
      uploads: '',
      ...covertCamelCase2Kebab(nextQuery),
    },
    {}
  );

  const arrayProp = makeArrayProp(ret.data);
  arrayProp('Uploads');
  arrayProp('CommonPrefixes');

  return ret;
}
