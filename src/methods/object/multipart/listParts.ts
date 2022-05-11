import { covertCamelCase2Kebab, makeArrayProp } from '../../../utils';
import TOSBase from '../../base';

interface ListPartInput {
  bucket?: string;
  key: string;
  uploadId: string;
  maxParts?: number;
  partNumberMarker?: number;
  encodingType?: string;
}

interface ListPartOutput {
  Bucket: string;
  Key: string;
  UploadId: string;
  PartNumberMarker: number;
  NextPartNumberMarker: number;
  MaxParts: number;
  IsTruncated: boolean;
  StorageClass: string;
  Owner: { ID: string; DisplayName: string };
  Parts: {
    PartNumber: number;
    LastModified: string;
    ETag: string;
    Size: number;
  }[];
}

// the part except last one must be >= 5 MB
// the last part is no size limit
export const MIN_PART_SIZE_EXCEPT_LAST_ONE = 5 * 1024 * 1024;
export const MAX_PART_NUMBER = 10000;

export const calculateSafePartSize = (
  totalSize: number,
  expectPartSize: number,
  showWarning = false
) => {
  let partSize = expectPartSize;
  if (expectPartSize < MIN_PART_SIZE_EXCEPT_LAST_ONE) {
    partSize = MIN_PART_SIZE_EXCEPT_LAST_ONE;
    if (showWarning) {
      console.warn(
        `partSize has been set to ${partSize}, because the partSize you provided is less than the minimal size of multipart`
      );
    }
  }
  const minSize = Math.ceil(totalSize / MAX_PART_NUMBER);
  if (expectPartSize < minSize) {
    partSize = minSize;
    if (showWarning) {
      console.warn(
        `partSize has been set to ${partSize}, because the partSize you provided causes the number of part excesses 10,000`
      );
    }
  }

  return partSize;
};

export async function listParts(this: TOSBase, input: ListPartInput) {
  const { bucket, key, uploadId, ...nextQuery } = input;
  const ret = await this.fetchObject<ListPartOutput>(
    input,
    'GET',
    {
      uploadId,
      ...covertCamelCase2Kebab(nextQuery),
    },
    {}
  );
  const arrayProp = makeArrayProp(ret.data);
  arrayProp('Parts');

  return ret;
}
