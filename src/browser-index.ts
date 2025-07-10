import axios from 'axios';
import { TosServerError, TosServerCode } from './TosServerError';
import { TosClientError } from './TosClientError';
import { isCancelError as isCancel } from './utils';
import { UploadEventType } from './methods/object/multipart/uploadFile';
import {
  ACLType,
  StorageClassType,
  MetadataDirectiveType,
  AzRedundancyType,
  PermissionType,
  GranteeType,
  CannedType,
  HttpMethodType,
  LifecycleStatusType,
  StatusType,
  RedirectType,
  StorageClassInheritDirectiveType,
  TierType,
  VersioningStatusType,
  ReplicationStatusType,
  AccessPointStatusType,
  TransferAccelerationStatusType,
  MRAPMirrorBackRedirectPolicyType,
  WorkflowExecutionStateType,
  FileUncompressPrefixReplaced,
  FileCompressFlatten,
  AccessPointStatus,
  AcceleratorPrefetchJobStatus,
  AuditJobStateType,
  AuditScanType,
} from './TosExportEnum';
import { CancelError } from './CancelError';
import { ResumableCopyEventType } from './methods/object/multipart/resumableCopyObject';
import { DownloadEventType } from './methods/object/downloadFile';
import { DataTransferType } from './interface';
import { ShareLinkClient } from './ShareLinkClient';
import { InnerClient } from './InnerClient';
import { createDefaultRateLimiter } from './universal/rate-limiter';

const CancelToken = axios.CancelToken;
// for export
class TosClient extends InnerClient {
  // for umd bundle
  static TosServerError = TosServerError;
  static isCancel = isCancel;
  static CancelError = CancelError;
  static TosServerCode = TosServerCode;
  static TosClientError = TosClientError;
  static CancelToken = CancelToken;
  static ACLType = ACLType;
  static StorageClassType = StorageClassType;
  static MetadataDirectiveType = MetadataDirectiveType;
  static AzRedundancyType = AzRedundancyType;
  static PermissionType = PermissionType;
  static GranteeType = GranteeType;
  static CannedType = CannedType;
  static HttpMethodType = HttpMethodType;
  static LifecycleStatusType = LifecycleStatusType;
  static StatusType = StatusType;
  static RedirectType = RedirectType;
  static StorageClassInheritDirectiveType = StorageClassInheritDirectiveType;
  static TierType = TierType;
  /** @private unstable */
  static FileUncompressPrefixReplaced = FileUncompressPrefixReplaced;
  /** @private unstable */
  static FileCompressFlatten = FileCompressFlatten;
  static VersioningStatusType = VersioningStatusType;
  static createDefaultRateLimiter = createDefaultRateLimiter;
  static DataTransferType = DataTransferType;
  static UploadEventType = UploadEventType;
  static DownloadEventType = DownloadEventType;
  static ResumableCopyEventType = ResumableCopyEventType;
  static ReplicationStatusType = ReplicationStatusType;
  /** @private unstable */
  static AccessPointStatusType = AccessPointStatusType;
  /** @private unstable */
  static AccessPointStatus = AccessPointStatus;
  /** @private unstable */
  static AcceleratorPrefetchJobStatus = AcceleratorPrefetchJobStatus;
  /** @private unstable */
  static TransferAccelerationStatusType = TransferAccelerationStatusType;
  /** @private unstable */
  static MRAPMirrorBackRedirectPolicyType = MRAPMirrorBackRedirectPolicyType;
  /** @private unstable */
  static WorkflowExecutionStateType = WorkflowExecutionStateType;
  /** @private unstable */
  static ShareLinkClient = ShareLinkClient;
  /** @private unstable */
  static AuditJobStateType = AuditJobStateType;
  /** @private unstable */
  static AuditScanType = AuditScanType;
}

export default TosClient;

export { TosClient as TOS, TosClient };
export {
  TosServerError,
  TosClientError,
  isCancel,
  CancelError,
  TosServerCode,
  CancelToken,
  ACLType,
  StorageClassType,
  MetadataDirectiveType,
  AzRedundancyType,
  PermissionType,
  GranteeType,
  CannedType,
  HttpMethodType,
  LifecycleStatusType,
  RedirectType,
  StatusType,
  StorageClassInheritDirectiveType,
  TierType,
  VersioningStatusType,
  createDefaultRateLimiter,
  DataTransferType,
  UploadEventType,
  DownloadEventType,
  ResumableCopyEventType,
  ReplicationStatusType,
  AccessPointStatusType,
  AccessPointStatus,
  AcceleratorPrefetchJobStatus,
  TransferAccelerationStatusType,
  ShareLinkClient,
  MRAPMirrorBackRedirectPolicyType,
  WorkflowExecutionStateType,
  FileUncompressPrefixReplaced,
  FileCompressFlatten,
  AuditJobStateType,
  AuditScanType,
};

// TODO: hack for umd
if (
  process.env.TARGET_ENVIRONMENT === 'browser' &&
  process.env.BUILD_FORMAT === 'umd'
) {
  // @ts-ignore
  if (typeof window !== 'undefined') {
    // @ts-ignore
    window.TOS = TosClient;
    // @ts-ignore
    window.TosClient = TosClient;
  }
  if (typeof global !== 'undefined') {
    // @ts-ignore
    global.TOS = TosClient;
    // @ts-ignore
    global.TosClient = TosClient;
  }
  if (typeof globalThis !== 'undefined') {
    // @ts-ignore
    globalThis.TOS = TosClient;
    // @ts-ignore
    globalThis.TosClient = TosClient;
  }
}
