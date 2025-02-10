import { covertCamelCase2Kebab, makeArrayProp } from '../../utils';
import TOSBase from '../base';

export interface ListObjectsInput {
  bucket?: string;
  continuationToken?: string;
  delimiter?: string;
  encodingType?: string;
  fetchOwner?: string;
  maxKeys?: string | number;
  prefix?: string;
  marker?: string;

  /**
   * use `marker` instead of `startAfter`
   */
  startAfter?: string;
  /**
   * equal to listObjectVersions when input
   */
  versions?: string;
  listType?: string;
  versionIdMarker?: string;
  /**
   * only works when pass versions field
   */
  keyMarker?: string;
}

export interface ListObjectsContentItem {
  ETag: string;
  Key: string;
  // "2021-08-02T09:53:27.000Z"
  LastModified: string;
  Owner: { ID: string; DisplayName: string };
  Size: number;
  StorageClass: string;
}

export interface ListObjectsVersionItem {
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
export interface ListObjectsOutput {
  CommonPrefixes: ListedCommonPrefix[];
  Contents: ListObjectsContentItem[];
  IsTruncated: boolean;
  Marker: string;
  MaxKeys: number;
  KeyMarker?: string;
  Name: string;
  Prefix: string;
  ContinuationToken?: string;
  NextContinuationToken?: string;
  Delimiter?: string;
  EncodingType?: string;
  NextMarker?: string;
  VersionIdMarker?: string;
  Versions: ListObjectsVersionItem[];
  NextKeyMarker?: string;
  DeleteMarkers: ListObjectDeleteMarkerItem[];
  NextVersionIdMarker?: string;
}

class TOSListObjects extends TOSBase {
  listObjects = listObjects;
  listObjectVersions = listObjectVersions;
}

/**
 *
 * @deprecated use listObjectsType2 instead
 * @returns
 */
export async function listObjects(
  this: TOSListObjects,
  input: ListObjectsInput = {}
) {
  const { bucket, ...nextQuery } = input;
  const ret = await this.fetchBucket<ListObjectsOutput>(
    input.bucket,
    'GET',
    covertCamelCase2Kebab(nextQuery),
    {}
  );
  const arrayProp = makeArrayProp(ret.data);
  arrayProp('CommonPrefixes');
  arrayProp('Contents');
  arrayProp('Versions');
  arrayProp('DeleteMarkers');
  return ret;
}

export type ListObjectVersionsInput = Pick<
  ListObjectsInput,
  | 'bucket'
  | 'prefix'
  | 'delimiter'
  | 'keyMarker'
  | 'versionIdMarker'
  | 'maxKeys'
  | 'encodingType'
>;

export interface listObjectVersionsOutput {
  Name: string;
  Prefix: string;
  KeyMarker?: string;
  VersionIdMarker?: string;
  MaxKeys: number;
  Delimiter?: string;
  IsTruncated: boolean;
  EncodingType?: string;
  NextKeyMarker?: string;
  NextVersionIdMarker?: string;
  CommonPrefixes: ListedCommonPrefix[];
  Versions: ListObjectsVersionItem[];
  DeleteMarkers: ListObjectDeleteMarkerItem[];
}

export async function listObjectVersions(
  this: TOSListObjects,
  input: ListObjectVersionsInput = {}
) {
  const { bucket, ...nextQuery } = input;
  const ret = await this.fetchBucket<listObjectVersionsOutput>(
    input.bucket,
    'GET',
    covertCamelCase2Kebab({ versions: '', ...nextQuery }),
    {}
  );
  const arrayProp = makeArrayProp(ret.data);
  arrayProp('CommonPrefixes');
  arrayProp('Versions');
  arrayProp('DeleteMarkers');
  return ret;
}
