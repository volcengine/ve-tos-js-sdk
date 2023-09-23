import TOSBase from './methods/base';
import {
  listBuckets,
  createBucket,
  deleteBucket,
  headBucket,
  putBucketStorageClass,
} from './methods/bucket/base';
import { getBucketAcl, putBucketAcl } from './methods/bucket/acl';
import axios from 'axios';
import { TosServerError, TosServerCode } from './TosServerError';
import { TosClientError } from './TosClientError';
import { isCancelError as isCancel } from './utils';
import {
  getObject,
  getObjectV2,
  getObjectToFile,
} from './methods/object/getObject';
import putObject, { putObjectFromFile } from './methods/object/putObject';
import { listObjectVersions, listObjects } from './methods/object/listObjects';
import getPreSignedUrl from './methods/object/getPreSignedUrl';
import headObject from './methods/object/headObject';
import deleteObject from './methods/object/deleteObject';
import deleteMultiObjects from './methods/object/deleteMultiObjects';
import copyObject from './methods/object/copyObject';
import { getObjectAcl, putObjectAcl } from './methods/object/acl';
import {
  abortMultipartUpload,
  completeMultipartUpload,
  createMultipartUpload,
  listParts,
  uploadPart,
  listMultipartUploads,
  uploadPartFromFile,
} from './methods/object/multipart';
import appendObject from './methods/object/appendObject';
import setObjectMeta from './methods/object/setObjectMeta';
import { uploadPartCopy } from './methods/object/multipart/uploadPartCopy';
import uploadFile from './methods/object/multipart/uploadFile';
import { calculatePostSignature } from './methods/object/calculatePostSignature';
import {
  ACLType,
  StorageClassType,
  MetadataDirectiveType,
  AzRedundancyType,
  PermissionType,
  GranteeType,
  CannedType,
  HttpMethodType,
} from './TosExportEnum';
import { CancelError } from './CancelError';
import { resumableCopyObject } from './methods/object/multipart/resumableCopyObject';
import {
  deleteBucketPolicy,
  getBucketPolicy,
  putBucketPolicy,
} from './methods/bucket/policy';
import {
  getBucketVersioning,
  putBucketVersioning,
} from './methods/bucket/versioning';
import { preSignedPolicyURL } from './methods/object/preSignedPolicyURL';
import downloadFile from './methods/object/downloadFile';
import { getBucketLocation } from './methods/bucket/getBucketLocation';
import {
  deleteBucketCORS,
  getBucketCORS,
  putBucketCORS,
} from './methods/bucket/cors';
import { listObjectsType2 } from './methods/object/listObjectsType2';
import {
  deleteBucketLifecycle,
  getBucketLifecycle,
  putBucketLifecycle,
} from './methods/bucket/lifecycle';
import {
  putBucketEncryption,
  getBucketEncryption,
  deleteBucketEncryption,
} from './methods/bucket/encryption';
import {
  deleteBucketMirrorBack,
  getBucketMirrorBack,
  putBucketMirrorBack,
} from './methods/bucket/mirrorback';
import {
  deleteObjectTagging,
  getObjectTagging,
  putObjectTagging,
} from './methods/object/tagging';
import {
  deleteBucketReplication,
  getBucketReplication,
  putBucketReplication,
} from './methods/bucket/replication';
import {
  deleteBucketWebsite,
  getBucketWebsite,
  putBucketWebsite,
} from './methods/bucket/website';
import {
  getBucketNotification,
  putBucketNotification,
} from './methods/bucket/notification';
import {
  deleteBucketCustomDomain,
  getBucketCustomDomain,
  putBucketCustomDomain,
} from './methods/bucket/customDomain';
import {
  deleteBucketRealTimeLog,
  getBucketRealTimeLog,
  putBucketRealTimeLog,
} from './methods/bucket/realTimeLog';
import {
  deleteBucketInventory,
  getBucketInventory,
  listBucketInventory,
  putBucketInventory,
} from './methods/bucket/inventory';
import {
  createJob,
  deleteJob,
  describeJob,
  updateJobStatus,
  updateJobPriority,
  listJobs,
} from './methods/batch';
import {
  deleteBucketTagging,
  getBucketTagging,
  putBucketTagging,
} from './methods/bucket/tag';
import {
  getBucketPayByTraffic,
  putBucketPayByTraffic,
} from './methods/bucket/payByTraffic';
import {
  getBucketImageStyle,
  getBucketImageStyleList,
  deleteBucketImageStyle,
  putBucketImageStyle,
  putBucketImageStyleSeparator,
  putBucketImageProtect,
  getBucketImageProtect,
  getBucketImageStyleSeparator,
} from './methods/bucket/img';
import { getBucketIntelligenttiering } from './methods/bucket/intelligenttiering';
import {
  putBucketRename,
  getBucketRename,
  deleteBucketRename,
} from './methods/bucket/rename';
import restoreObject from './methods/object/restoreObject';
import { createDefaultRateLimiter } from './rate-limiter';

const CancelToken = axios.CancelToken;
// refer https://stackoverflow.com/questions/23876782/how-do-i-split-a-typescript-class-into-multiple-files
class TosClient extends TOSBase {
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

  // bucket base
  createBucket = createBucket;
  headBucket = headBucket;
  deleteBucket = deleteBucket;
  listBuckets = listBuckets;
  getBucketLocation = getBucketLocation;
  putBucketStorageClass = putBucketStorageClass;

  // bucket acl
  getBucketAcl = getBucketAcl;
  putBucketAcl = putBucketAcl;

  // bucket policy
  getBucketPolicy = getBucketPolicy;
  putBucketPolicy = putBucketPolicy;
  deleteBucketPolicy = deleteBucketPolicy;

  // bucket versioning
  getBucketVersioning = getBucketVersioning;
  putBucketVersioning = putBucketVersioning;

  // bucket cors
  getBucketCORS = getBucketCORS;
  putBucketCORS = putBucketCORS;
  deleteBucketCORS = deleteBucketCORS;

  // bucket lifecycle
  putBucketLifecycle = putBucketLifecycle;
  getBucketLifecycle = getBucketLifecycle;
  deleteBucketLifecycle = deleteBucketLifecycle;

  //bucket encryption
  putBucketEncryption = putBucketEncryption;
  getBucketEncryption = getBucketEncryption;
  deleteBucketEncryption = deleteBucketEncryption;

  // bucket mirror back
  putBucketMirrorBack = putBucketMirrorBack;
  getBucketMirrorBack = getBucketMirrorBack;
  deleteBucketMirrorBack = deleteBucketMirrorBack;

  // bucket replication
  putBucketReplication = putBucketReplication;
  getBucketReplication = getBucketReplication;
  deleteBucketReplication = deleteBucketReplication;

  // bucket website
  putBucketWebsite = putBucketWebsite;
  getBucketWebsite = getBucketWebsite;
  deleteBucketWebsite = deleteBucketWebsite;

  // bucket notification
  putBucketNotification = putBucketNotification;
  getBucketNotification = getBucketNotification;

  // bucket customdomain
  putBucketCustomDomain = putBucketCustomDomain;
  getBucketCustomDomain = getBucketCustomDomain;
  deleteBucketCustomDomain = deleteBucketCustomDomain;

  // bucket timelog
  putBucketRealTimeLog = putBucketRealTimeLog;
  getBucketRealTimeLog = getBucketRealTimeLog;
  deleteBucketRealTimeLog = deleteBucketRealTimeLog;

  // bucket Inventory
  getBucketInventory = getBucketInventory;
  listBucketInventory = listBucketInventory;
  putBucketInventory = putBucketInventory;
  deleteBucketInventory = deleteBucketInventory;

  // bucket tag
  putBucketTagging = putBucketTagging;
  getBucketTagging = getBucketTagging;
  deleteBucketTagging = deleteBucketTagging;

  // bucket pay by traffic
  putBucketPayByTraffic = putBucketPayByTraffic;
  getBucketPayByTraffic = getBucketPayByTraffic;

  // bucket imgStyle
  getBucketImageStyle = getBucketImageStyle;
  getBucketImageStyleList = getBucketImageStyleList;
  deleteBucketImageStyle = deleteBucketImageStyle;
  putBucketImageStyle = putBucketImageStyle;
  putBucketImageStyleSeparator = putBucketImageStyleSeparator;
  putBucketImageProtect = putBucketImageProtect;
  getBucketImageProtect = getBucketImageProtect;
  getBucketImageStyleSeparator = getBucketImageStyleSeparator;

  // bucket tag
  putBucketRename = putBucketRename;
  getBucketRename = getBucketRename;
  deleteBucketRename = deleteBucketRename;

  // object base
  copyObject = copyObject;
  resumableCopyObject = resumableCopyObject;
  deleteObject = deleteObject;
  deleteMultiObjects = deleteMultiObjects;
  getObject = getObject;
  getObjectV2 = getObjectV2;
  getObjectToFile = getObjectToFile;
  getObjectAcl = getObjectAcl;
  headObject = headObject;
  appendObject = appendObject;
  listObjects = listObjects;

  listObjectsType2 = listObjectsType2;

  listObjectVersions = listObjectVersions;
  putObject = putObject;
  putObjectFromFile = putObjectFromFile;
  putObjectAcl = putObjectAcl;
  setObjectMeta = setObjectMeta;

  // object multipart
  createMultipartUpload = createMultipartUpload;
  uploadPart = uploadPart;
  uploadPartFromFile = uploadPartFromFile;
  completeMultipartUpload = completeMultipartUpload;
  abortMultipartUpload = abortMultipartUpload;
  uploadPartCopy = uploadPartCopy;
  listMultipartUploads = listMultipartUploads;
  listParts = listParts;
  downloadFile = downloadFile;

  // object tagging
  putObjectTagging = putObjectTagging;
  getObjectTagging = getObjectTagging;
  deleteObjectTagging = deleteObjectTagging;

  // batch job
  listJobs = listJobs;
  createJob = createJob;
  deleteJob = deleteJob;
  describeJob = describeJob;
  updateJobStatus = updateJobStatus;
  updateJobPriority = updateJobPriority;

  // restore object
  restoreObject = restoreObject;
  // object others
  uploadFile = uploadFile;
  getPreSignedUrl = getPreSignedUrl;
  /**
   * alias to preSignedPostSignature
   */
  calculatePostSignature = calculatePostSignature;
  preSignedPostSignature = calculatePostSignature;
  preSignedPolicyURL = preSignedPolicyURL;
  // object intelligenttiering
  getBucketIntelligenttiering = getBucketIntelligenttiering;
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
  createDefaultRateLimiter,
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
