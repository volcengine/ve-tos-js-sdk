import { covertCamelCase2Kebab, makeArrayProp } from '../../utils';
import TOSBase from '../base';

export interface ListObjectsType2Input {
  bucket?: string;
  prefix?: string;
  delimiter?: string;
  encodingType?: string;
  maxKeys?: string | number;
  continuationToken?: string;
  startAfter?: string;
}

export interface ListObjectsType2ContentItem {
  ETag: string;
  Key: string;
  // "2021-08-02T09:53:27.000Z"
  LastModified: string;
  Owner?: { ID: string; DisplayName: string };
  Size: number;
  StorageClass: string;
  HashCrc64ecma?: string;
}

export interface ListObjectsType2VersionItem {
  ETag: string;
  IsLatest: boolean;
  Key: string;
  LastModified: string;
  Owner: { ID: string; DisplayName: string };
  Size: number;
  StorageClass: string;
  VersionId: string;
}

export interface ListObjectDeleteMarkerItem {
  ETag: string;
  IsLatest: boolean;
  Key: string;
  LastModified: string;
  Owner: { ID: string; DisplayName: string };
  Size: number;
  StorageClass: string;
  VersionId: string;
}

export interface ListedCommonPrefix {
  Prefix: string;
}

export interface ListObjectsType2Output {
  Name: string;
  Prefix: string;
  MaxKeys: number;
  Delimiter?: string;
  EncodingType?: string;
  IsTruncated: boolean;
  StartAfter?: string;
  ContinuationToken?: string;
  NextContinuationToken?: string;
  CommonPrefixes: ListedCommonPrefix[];
  Contents: ListObjectsType2ContentItem[];
}

class TOSListObjectsType2 extends TOSBase {
  listObjectsType2 = listObjectsType2;
}

export async function listObjectsType2(
  this: TOSListObjectsType2,
  input: ListObjectsType2Input = {}
) {
  const { bucket, ...nextQuery } = input;
  const ret = await this.fetchBucket<ListObjectsType2Output>(
    input.bucket,
    'GET',
    {
      'list-type': 2,
      ...covertCamelCase2Kebab(nextQuery),
    },
    {}
  );
  const arrayProp = makeArrayProp(ret.data);
  arrayProp('CommonPrefixes');
  arrayProp('Contents');
  return ret;
}
