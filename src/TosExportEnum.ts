export enum ACLType {
  ACLPrivate = 'private',
  ACLPublicRead = 'public-read',
  ACLPublicReadWrite = 'public-read-write',
  ACLAuthenticatedRead = 'authenticated-read',
  ACLBucketOwnerRead = 'bucket-owner-read',
  ACLBucketOwnerFullControl = 'bucket-owner-full-control',
  // only works for object ACL
  ACLBucketOwnerEntrusted = 'bucket-owner-entrusted',
}

export enum StorageClassType {
  // storage-class will inherit from bucket if uploading object without `x-tos-storage-class` header
  StorageClassStandard = 'STANDARD',
  StorageClassIa = 'IA',
  StorageClassArchiveFr = 'ARCHIVE_FR',
  StorageClassColdArchive = 'COLD_ARCHIVE',
  StorageClassIntelligentTiering = 'INTELLIGENT_TIERING',
}

export enum MetadataDirectiveType {
  MetadataDirectiveCopy = 'COPY',
  MetadataDirectiveReplace = 'REPLACE',
}

export enum AzRedundancyType {
  AzRedundancySingleAz = 'single-az',
  AzRedundancyMultiAz = 'multi-az',
}

export enum PermissionType {
  PermissionRead = 'READ',
  PermissionWrite = 'WRITE',
  PermissionReadAcp = 'READ_ACP',
  PermissionWriteAcp = 'WRITE_ACP',
  PermissionFullControl = 'FULL_CONTROL',
}

export enum GranteeType {
  GranteeGroup = 'Group',
  GranteeUser = 'CanonicalUser',
}

export enum CannedType {
  CannedAllUsers = 'AllUsers',
  CannedAuthenticatedUsers = 'AuthenticatedUsers',
}

export enum HttpMethodType {
  HttpMethodGet = 'GET',
  HttpMethodPut = 'PUT',
  HttpMethodPost = 'POST',
  HttpMethodDelete = 'DELETE',
  HttpMethodHead = 'HEAD',
}

export enum StorageClassInheritDirectiveType {
  StorageClassInheritDirectiveDestinationBucket = 'DESTINATION_BUCKET',
  StorageClassInheritDirectiveSourceObject = 'SOURCE_OBJECT',
}
