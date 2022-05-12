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
  versions?: string;
  listType?: string;
  versionIdMarker?: string;
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

export interface ListObjectsOutput {
  CommonPrefixes: string[];
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

export type ListObjectVersionsInput = Omit<ListObjectsInput, 'versions'>;

export async function listObjectVersions(
  this: TOSListObjects,
  input: ListObjectVersionsInput = {}
) {
  return this.listObjects({ versions: '', ...input });
}
