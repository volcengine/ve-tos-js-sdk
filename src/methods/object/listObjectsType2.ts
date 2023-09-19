import { covertCamelCase2Kebab, makeArrayProp } from '../../utils';
import TOSBase, { TosResponse } from '../base';

export interface ListObjectsType2Input {
  bucket?: string;
  prefix?: string;
  delimiter?: string;
  encodingType?: string;
  /**
   * if not specify `maxKeys` field, default maxKeys value is 1000.
   */
  maxKeys?: number;
  continuationToken?: string;
  startAfter?: string;
  /**
   * default value: false
   * if set false, the method will keep fetch objects until get `maxKeys` objects.
   * if set true,  the method will fetch objects once
   */
  listOnlyOnce?: boolean;
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
  KeyCount: number;
  StartAfter?: string;
  ContinuationToken?: string;
  NextContinuationToken?: string;
  CommonPrefixes: ListedCommonPrefix[];
  Contents: ListObjectsType2ContentItem[];
}

class TOSListObjectsType2 extends TOSBase {
  listObjectsType2 = listObjectsType2;
}
const DefaultListMaxKeys = 1000;

export async function listObjectsType2(
  this: TOSListObjectsType2,
  input: ListObjectsType2Input = {}
): Promise<TosResponse<ListObjectsType2Output>> {
  const { listOnlyOnce = false } = input;

  let output;
  if (!input.maxKeys) {
    input.maxKeys = DefaultListMaxKeys;
  }

  if (listOnlyOnce) {
    output = await listObjectsType2Once.call(this, input);
  } else {
    const maxKeys = input.maxKeys;
    let params = {
      ...input,
      maxKeys,
    };
    while (true) {
      const res = await listObjectsType2Once.call(this, params);
      if (output == null) {
        output = res;
      } else {
        output = {
          ...res,
          data: output.data,
        };
        output.data.KeyCount += res.data.KeyCount;
        output.data.IsTruncated = res.data.IsTruncated;
        output.data.NextContinuationToken = res.data.NextContinuationToken;
        output.data.Contents = output.data.Contents.concat(res.data.Contents);
        output.data.CommonPrefixes = output.data.CommonPrefixes.concat(
          res.data.CommonPrefixes
        );
      }

      if (!res.data.IsTruncated || output.data.Contents.length >= maxKeys) {
        break;
      }

      params.continuationToken = res.data.NextContinuationToken;
      params.maxKeys = params.maxKeys - res.data.KeyCount;
    }
  }

  return output;
}
async function listObjectsType2Once(
  this: TOSListObjectsType2,
  input: ListObjectsType2Input
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
