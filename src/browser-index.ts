import TOSBase from './methods/base';
import {
  listBuckets,
  createBucket,
  deleteBucket,
  headBucket,
} from './methods/bucket/base';
import getObject from './methods/object/getObject';
import putObject from './methods/object/putObject';
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
} from './methods/object/multipart';
import appendObject from './methods/object/appendObject';
import setObjectMeta from './methods/object/setObjectMeta';
import { uploadPartCopy } from './methods/object/multipart/uploadPartCopy';
import uploadFile from './methods/object/multipart/uploadFile';

// refer https://stackoverflow.com/questions/23876782/how-do-i-split-a-typescript-class-into-multiple-files
class TOS extends TOSBase {
  // bucket base
  createBucket = createBucket;
  headBucket = headBucket;
  deleteBucket = deleteBucket;
  listBuckets = listBuckets;

  // object base
  copyObject = copyObject;
  deleteObject = deleteObject;
  deleteMultiObjects = deleteMultiObjects;
  getObject = getObject;
  getObjectAcl = getObjectAcl;
  headObject = headObject;
  appendObject = appendObject;
  listObjects = listObjects;
  listObjectVersions = listObjectVersions;
  putObject = putObject;
  putObjectAcl = putObjectAcl;
  setObjectMeta = setObjectMeta;

  // object multipart
  createMultipartUpload = createMultipartUpload;
  uploadPart = uploadPart;
  completeMultipartUpload = completeMultipartUpload;
  abortMultipartUpload = abortMultipartUpload;
  uploadPartCopy = uploadPartCopy;
  listMultipartUploads = listMultipartUploads;
  listParts = listParts;

  // object others
  uploadFile = uploadFile;
  getPreSignedUrl = getPreSignedUrl;
}

export default TOS;

export { ResponseError } from './responseError';
export {
  isCancelError as isCancel,
  CancelError,
} from './methods/object/multipart/uploadFile';
export { TOS };
