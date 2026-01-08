export enum ACLType {
  ACLPrivate = 'private',
  ACLPublicRead = 'public-read',
  ACLPublicReadWrite = 'public-read-write',
  ACLAuthenticatedRead = 'authenticated-read',
  ACLBucketOwnerRead = 'bucket-owner-read',
  ACLBucketOwnerFullControl = 'bucket-owner-full-control',
  // only works for object ACL
  ACLBucketOwnerEntrusted = 'bucket-owner-entrusted',
  /**
   * @private unstable value for object ACL
   */
  ACLDefault = 'default',
}

export enum StorageClassType {
  // storage-class will inherit from bucket if uploading object without `x-tos-storage-class` header
  StorageClassStandard = 'STANDARD',
  StorageClassIa = 'IA',
  StorageClassArchiveFr = 'ARCHIVE_FR',
  StorageClassColdArchive = 'COLD_ARCHIVE',
  StorageClassIntelligentTiering = 'INTELLIGENT_TIERING',
  StorageClassArchive = 'ARCHIVE',
  StorageClassDeepColdArchive = 'DEEP_COLD_ARCHIVE',
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
  /**
   * @private unstable value for ACL
   */
  PermissionReadNONLIST = 'READ_NON_LIST',
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

export enum ReplicationStatusType {
  Complete = 'COMPLETE',
  Pending = 'PENDING',
  Failed = 'FAILED',
  Replica = 'REPLICA',
}

export enum LifecycleStatusType {
  Enabled = 'Enabled',
  Disabled = 'Disabled',
}

export enum RedirectType {
  Mirror = 'Mirror',
  Async = 'Async',
}

export enum StatusType {
  Enabled = 'Enabled',
  Disabled = 'Disabled',
}

export enum TierType {
  TierStandard = 'Standard',
  TierExpedited = 'Expedited',
  TierBulk = 'Bulk',
}

export enum VersioningStatusType {
  Enabled = 'Enabled',
  Suspended = 'Suspended',
  NotSet = '',

  /**
   * @deprecated use `Enabled` instead
   */
  Enable = 'Enabled',
  /**
   * @deprecated use `NotSet` instead
   */
  Disable = '',
}

/**
 * @private unstable
 */
export enum AccessPointStatusType {
  Ready = 'READY',
  Creating = 'CREATING',
  Created = 'CREATED',
  Deleting = 'DELETING',
}

/**
 * @private unstable
 */
export enum TransferAccelerationStatusType {
  Activating = 'AccelerationActivating',
  Activated = 'AccelerationActivated',
  Terminated = 'AccelerationTerminated',
}

/**
 * @private unstable
 */
export enum MRAPMirrorBackRedirectPolicyType {
  ClosestFirst = 'Closest-First',
  LatestFirst = 'Latest-First',
}

/**
 * @private unstable
 */
export enum WorkflowExecutionStateType {
  Success = 'Success',
  Running = 'Running',
  Submitted = 'Submitted',
  Failed = 'Failed',
}

/** @private unstable */
export enum FileCompressFlatten {
  /** Preserve directory structure */
  KeepStructure = 0,
  /** Flatten all directory structures */
  FlattenAll = 1,
  /** Create directory based on Prefix (Prefix mode only) */
  PrefixAsDirectory = 2,
  /** Only package contents under Prefix (Prefix mode only) */
  PrefixContentsOnly = 3,
}

/**
 * @private unstable
 */
export enum FileUncompressPrefixReplaced {
  /** No extra prefix added */
  NoExtraPrefix = 0,
  /** Use the archive name as the prefix */
  WithArchiveName = 1,
  /** Preserve the full archive path */
  FullArchivePath = 2,
}

/**
 * @private unstable
 */
export enum AccessPointStatus {
  Enable = 'enable',
  Disable = 'disable',
  Creating = 'creating',
  Deleting = 'deleting',
}

/**
 * @private unstable
 */
export enum AcceleratorPrefetchJobStatus {
  Null = 'NULL',
  Idle = 'IDLE',
  Running = 'RUNNING',
  Stopping = 'STOPPING',
  Complete = 'COMPLETE',
}

/**
 * @private unstable
 */
export enum AuditJobStateType {
  Submitted = 'Submitted',
  Running = 'Running',
  Success = 'Success',
  Failed = 'Failed',
  Paused = 'Paused',
  Canceled = 'Canceled',
}

/**
 * @private unstable
 */
export enum AuditScanType {
  Manifest = 'Manifest',
  Scan = 'Scan',
}

/**
 * @private unstable
 */
export enum AuditType {
  Image = 'image',
  Video = 'video',
  Audio = 'audio',
}

/**
 * @private unstable
 */
export enum CallbackTriggerModeType {
  Freeze = 'freeze',
  Sensitive = 'sensitive',
  Failure = 'failure',
}

/**
 * @private unstable
 */
export enum FreezeModeType {
  Archive = 'archive',
  Private = 'private',
}

/**
 * @private unstable
 */
export enum TemplateTagType {
  AudioConvert = 'AudioConvert',
  Transcode = 'Transcode',
}

/**
 * @private unstable
 */
export enum AudioContainerFormatType {
  Wav = 'wav',
  Mp3 = 'mp3',
  Aac = 'aac',
  Flac = 'flac',
  Oga = 'oga',
  Ac3 = 'ac3',
  Opus = 'opus',
}

/**
 * @private unstable
 */
export enum ContainerFormatType {
  Mp4 = 'mp4',
  Ts = 'ts',
}

/**
 * @private unstable
 */
export enum SampleFormatType {
  Fltp = 'fltp',
  S16p = 's16p',
  S32p = 's32p',
  S16 = 's16',
  S32 = 's32',
}

export enum DataType {
  DataTypeFloat32 = 'float32',
}

export enum DistanceMetricType {
  DistanceMetricEuclidean = 'euclidean',
  DistanceMetricCosine = 'cosine',
}
