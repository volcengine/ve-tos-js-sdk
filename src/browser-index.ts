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

const CancelToken = axios.CancelToken;
// refer https://stackoverflow.com/questions/23876782/how-do-i-split-a-typescript-class-into-multiple-files
class TOS extends TOSBase {
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

  // bucket customdomain
  putBucketRealTimeLog = putBucketRealTimeLog;
  getBucketRealTimeLog = getBucketRealTimeLog;
  deleteBucketRealTimeLog = deleteBucketRealTimeLog;

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

  // object others
  uploadFile = uploadFile;
  getPreSignedUrl = getPreSignedUrl;
  /**
   * alias to preSignedPostSignature
   */
  calculatePostSignature = calculatePostSignature;
  preSignedPostSignature = calculatePostSignature;
  preSignedPolicyURL = preSignedPolicyURL;
}

export default TOS;

export { TOS };
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
};

// TODO: hack for umd
if (
  process.env.TARGET_ENVIRONMENT === 'browser' &&
  process.env.BUILD_FORMAT === 'umd'
) {
  // @ts-ignore
  window.TOS = TOS;
}
