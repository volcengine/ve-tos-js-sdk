import TOSBase from './methods/base';
import {
  listBuckets,
  createBucket,
  deleteBucket,
  headBucket,
  putBucketStorageClass,
} from './methods/bucket/base';
import { getBucketAcl, putBucketAcl } from './methods/bucket/acl';
import {
  getBucketHttpsConfig,
  putBucketHttpsConfig,
} from './methods/bucket/httpsConfig';
import {
  getObject,
  getObjectV2,
  getObjectToFile,
} from './methods/object/getObject';
import putObject, { putObjectFromFile } from './methods/object/putObject';
import { fetchObject, putFetchTask } from './methods/object/fetch';
import { listObjectVersions, listObjects } from './methods/object/listObjects';
import getPreSignedUrl from './methods/object/getPreSignedUrl';
import headObject from './methods/object/headObject';
import deleteObject from './methods/object/deleteObject';
import renameObject from './methods/object/renameObject';
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
  getBucketImageStyleListByName,
  getImageStyleBriefInfo,
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
import {
  deleteStorageLens,
  getStorageLens,
  listStorageLens,
  putStorageLens,
} from './methods/storageLens';
import {
  putBucketNotificationType2,
  getBucketNotificationType2,
} from './methods/bucket/notificationType2';

import putSymlink from './methods/object/putSymlink';
import getSymlink from './methods/object/getSymlink';
import {
  getBucketTransferAcceleration,
  putBucketTransferAcceleration,
} from './methods/bucket/acceleration';
import {
  getBucketAccessMonitor,
  putBucketAccessMonitor,
} from './methods/bucket/accessMonitor';
import {
  getQosPolicy,
  putQosPolicy,
  deleteQosPolicy,
} from './methods/qosPolicy';
import {
  createMultiRegionAccessPoint,
  getMultiRegionAccessPoint,
  listMultiRegionAccessPoints,
  getMultiRegionAccessPointRoutes,
  deleteMultiRegionAccessPoint,
  submitMultiRegionAccessPointRoutes,
  listBindAccessPointForMultiRegionAccelerator,
  bindAcceleratorWithMultiRegionAccessPoint,
  unbindAcceleratorWithMultiRegionAccessPoint,
} from './methods/mrap';
import {
  createAccessPoint,
  getAccessPoint,
  listAccessPoints,
  deleteAccessPoint,
  listBindAccessPointForAccelerator,
  bindAcceleratorWithAccessPoint,
  unbindAcceleratorWithAccessPoint,
} from './methods/accesspoint';
import {
  putAccelerator,
  getAccelerator,
  deleteAccelerator,
  listAccelerators,
  listAcceleratorAzs,
  putAcceleratorPrefetchJob,
  getAcceleratorPrefetchJob,
  deleteAcceleratorPrefetchJob,
  listAcceleratorPrefetchJobs,
  listAcceleratorPrefetchJobRecords,
} from './methods/accelerator';
import {
  putMultiRegionAccessPointMirrorBack,
  getMultiRegionAccessPointMirrorBack,
  deleteMultiRegionAccessPointMirrorBack,
} from './methods/mrap/mirror';
import {
  putBucketPrivateM3U8,
  getBucketPrivateM3U8,
  putBucketBlindWatermark,
  getBucketBlindWatermark,
} from './methods/bucket/media';
import { getBucketTrash, putBucketTrash } from './methods/bucket/trash';
import {
  putBucketObjectLockConfiguration,
  getBucketObjectLockConfiguration,
} from './methods/bucket/lock';
import {
  putObjectRetention,
  getObjectRetention,
} from './methods/object/retention';
import {
  putBucketCdnNotification,
  getBucketCdnNotification,
  deleteBucketCdnNotification,
} from './methods/bucket/cdnNotification';
import {
  getBucketWorkflow,
  putBucketWorkflow,
  deleteBucketWorkflow,
  getBucketWorkflowExecution,
  listBucketWorkflowExecution,
} from './methods/bucket/workflow';
import { createFileCompress } from './methods/fileCompress';
import { createFileUncompress } from './methods/fileUncompress';
import {
  deleteBucketLogging,
  getBucketLogging,
  putBucketLogging,
} from './methods/bucket/logging';
import {
  putAccessPointPolicy,
  getAccessPointPolicy,
  deleteAccessPointPolicy,
  putMultiRegionAccessPointPolicy,
  getMultiRegionAccessPointPolicy,
  deleteMultiRegionAccessPointPolicy,
} from './methods/mrap/policy';
import {
  putBucketAudit,
  getBucketAudit,
  listBucketAuditJob,
  getBucketAuditJob,
  postBucketAuditJob,
  listBucketAuditBizType,
} from './methods/bucket/audit';
import { listBucketJob, getBucketJob } from './methods/bucket/listJob';
import { createBucketAudioConvert } from './methods/bucket/audioConvert';
import { getObjectAITag } from './methods/object/getObjectAITag';
import {
  getBucketRequestPayment,
  putBucketRequestPayment,
} from './methods/bucket/requestPayment';

// refer https://stackoverflow.com/questions/23876782/how-do-i-split-a-typescript-class-into-multiple-files
export class InnerClient extends TOSBase {
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

  // bucket https config
  putBucketHttpsConfig = putBucketHttpsConfig;
  getBucketHttpsConfig = getBucketHttpsConfig;

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
  getBucketImageStyleListByName = getBucketImageStyleListByName;
  getImageStyleBriefInfo = getImageStyleBriefInfo;
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

  // bucket acceleration
  putBucketTransferAcceleration = putBucketTransferAcceleration;
  getBucketTransferAcceleration = getBucketTransferAcceleration;

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
  renameObject = renameObject;
  fetchObject = fetchObject;
  putFetchTask = putFetchTask;

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

  // storageLens
  listStorageLens = listStorageLens;
  deleteStorageLens = deleteStorageLens;
  getStorageLens = getStorageLens;
  putStorageLens = putStorageLens;

  // bucket notificationV2
  putBucketNotificationType2 = putBucketNotificationType2;
  getBucketNotificationType2 = getBucketNotificationType2;

  // symlink
  putSymlink = putSymlink;
  getSymlink = getSymlink;

  // bucket accessMonitor
  putBucketAccessMonitor = putBucketAccessMonitor;
  getBucketAccessMonitor = getBucketAccessMonitor;

  // qospolicy
  putQosPolicy = putQosPolicy;
  getQosPolicy = getQosPolicy;
  deleteQosPolicy = deleteQosPolicy;

  // mrap
  createMultiRegionAccessPoint = createMultiRegionAccessPoint;
  getMultiRegionAccessPoint = getMultiRegionAccessPoint;
  listMultiRegionAccessPoints = listMultiRegionAccessPoints;
  getMultiRegionAccessPointRoutes = getMultiRegionAccessPointRoutes;
  deleteMultiRegionAccessPoint = deleteMultiRegionAccessPoint;
  submitMultiRegionAccessPointRoutes = submitMultiRegionAccessPointRoutes;

  // mrap-accelerator
  bindAcceleratorWithMultiRegionAccessPoint =
    bindAcceleratorWithMultiRegionAccessPoint;
  unbindAcceleratorWithMultiRegionAccessPoint =
    unbindAcceleratorWithMultiRegionAccessPoint;
  listBindAccessPointForMultiRegionAccelerator =
    listBindAccessPointForMultiRegionAccelerator;

  // mrap mirror back
  putMultiRegionAccessPointMirrorBack = putMultiRegionAccessPointMirrorBack;
  getMultiRegionAccessPointMirrorBack = getMultiRegionAccessPointMirrorBack;
  deleteMultiRegionAccessPointMirrorBack =
    deleteMultiRegionAccessPointMirrorBack;

  // mrap policy
  putMultiRegionAccessPointPolicy = putMultiRegionAccessPointPolicy;
  getMultiRegionAccessPointPolicy = getMultiRegionAccessPointPolicy;
  deleteMultiRegionAccessPointPolicy = deleteMultiRegionAccessPointPolicy;

  putAccessPointPolicy = putAccessPointPolicy;
  getAccessPointPolicy = getAccessPointPolicy;
  deleteAccessPointPolicy = deleteAccessPointPolicy;
  // accesspoint
  createAccessPoint = createAccessPoint;
  getAccessPoint = getAccessPoint;
  listAccessPoints = listAccessPoints;
  deleteAccessPoint = deleteAccessPoint;
  bindAcceleratorWithAccessPoint = bindAcceleratorWithAccessPoint;
  unbindAcceleratorWithAccessPoint = unbindAcceleratorWithAccessPoint;
  listBindAccessPointForAccelerator = listBindAccessPointForAccelerator;

  // accelerator
  listAcceleratorAzs = listAcceleratorAzs;
  putAccelerator = putAccelerator;
  getAccelerator = getAccelerator;
  listAccelerators = listAccelerators;
  deleteAccelerator = deleteAccelerator;
  putAcceleratorPrefetchJob = putAcceleratorPrefetchJob;
  getAcceleratorPrefetchJob = getAcceleratorPrefetchJob;
  deleteAcceleratorPrefetchJob = deleteAcceleratorPrefetchJob;
  listAcceleratorPrefetchJobs = listAcceleratorPrefetchJobs;
  listAcceleratorPrefetchJobRecords = listAcceleratorPrefetchJobRecords;

  // pm3u8
  putBucketPrivateM3U8 = putBucketPrivateM3U8;
  getBucketPrivateM3U8 = getBucketPrivateM3U8;
  // 盲水印
  putBucketBlindWatermark = putBucketBlindWatermark;
  getBucketBlindWatermark = getBucketBlindWatermark;
  // hns trash
  putBucketTrash = putBucketTrash;
  getBucketTrash = getBucketTrash;

  // bucket lock
  putBucketObjectLockConfiguration = putBucketObjectLockConfiguration;
  getBucketObjectLockConfiguration = getBucketObjectLockConfiguration;

  // object retention
  putObjectRetention = putObjectRetention;
  getObjectRetention = getObjectRetention;
  // cdn notification
  putBucketCdnNotification = putBucketCdnNotification;
  getBucketCdnNotification = getBucketCdnNotification;
  deleteBucketCdnNotification = deleteBucketCdnNotification;

  // workflow
  putBucketWorkflow = putBucketWorkflow;
  getBucketWorkflow = getBucketWorkflow;
  deleteBucketWorkflow = deleteBucketWorkflow;
  getBucketWorkflowExecution = getBucketWorkflowExecution;
  listBucketWorkflowExecution = listBucketWorkflowExecution;

  // audit
  putBucketAudit = putBucketAudit;
  getBucketAudit = getBucketAudit;
  listBucketAuditJob = listBucketAuditJob;
  getBucketAuditJob = getBucketAuditJob;
  postBucketAuditJob = postBucketAuditJob;
  listBucketAuditBizType = listBucketAuditBizType;

  // bucket file compress
  createFileCompress = createFileCompress;
  // bucket file uncompress
  createFileUncompress = createFileUncompress;
  createBucketAudioConvert = createBucketAudioConvert;
  listBucketJob = listBucketJob;
  getBucketJob = getBucketJob;
  // logging
  putBucketLogging = putBucketLogging;
  getBucketLogging = getBucketLogging;
  deleteBucketLogging = deleteBucketLogging;
  getObjectAITag = getObjectAITag;
  // requestPayment
  putBucketRequestPayment = putBucketRequestPayment;
  getBucketRequestPayment = getBucketRequestPayment;
}
