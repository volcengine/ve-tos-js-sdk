import { AxiosResponse } from 'axios';
import { Headers } from './interface';

export interface TosServerErrorData {
  Code: string;
  HostId: string;
  Message: string;
  RequestId: string;
  EC?: string;
}

export class TosServerError extends Error {
  /**
   * is original from backend, equals `data.Code`
   */
  public code: string;

  /**
   * the body when backend errors
   */
  public data: TosServerErrorData;
  /**
   * status code
   */
  public statusCode: number;
  /**
   * response headers
   */
  public headers: Headers;

  /**
   * identifies the errored request, equals to headers['x-tos-request-id'].
   * If you has any question about the request, please send the requestId and id2 to TOS worker.
   */
  public requestId: string;

  /**
   * identifies the errored request, equals to headers['x-tos-id-2'].
   * If you has any question about the request, please send the requestId and id2 to TOS worker.
   */
  public id2: string;

  constructor(response: AxiosResponse<TosServerErrorData>) {
    const { data } = response;
    super(data.Message);

    // https://www.dannyguo.com/blog/how-to-fix-instanceof-not-working-for-custom-errors-in-typescript/
    Object.setPrototypeOf(this, TosServerError.prototype);

    this.data = data;
    this.code = data.Code;
    this.statusCode = response.status;
    this.headers = response.headers;
    this.requestId = response.headers['x-tos-request-id'];
    this.id2 = response.headers['x-tos-id-2'];
  }
}

export default TosServerError;

export enum TosServerCode {
  NoSuchBucket = 'NoSuchBucket',
  NoSuchKey = 'NoSuchKey',
  AccessDenied = 'AccessDenied',
  MalformedAcl = 'MalformedAclError',
  UnexpectedContent = 'UnexpectedContent',
  InvalidRequest = 'InvalidRequest',
  MissingSecurityHeader = 'MissingSecurityHeader',
  InvalidArgument = 'InvalidArgument',
  EntityTooSmall = 'EntityTooSmall',
  InvalidBucketName = 'InvalidBucketName',
  BucketNotEmpty = 'BucketNotEmpty',
  TooManyBuckets = 'TooManyBuckets',
  BucketAlreadyExists = 'BucketAlreadyExists',
  MalformedBody = 'MalformedBody',
  NoSuchLifecycleConfiguration = 'NoSuchLifecycleConfiguration',
  ReplicationConfigurationNotFound = 'ReplicationConfigurationNotFoundError',
  InvalidLocationConstraint = 'InvalidLocationConstraint',
  AuthorizationQueryParametersError = 'AuthorizationQueryParametersError',
  RequestTimeTooSkewed = 'RequestTimeTooSkewed',
  SignatureDoesNotMatch = 'SignatureDoesNotMatch',
  RequestedRangeNotSatisfiable = 'Requested Range Not Satisfiable',
  PreconditionFailed = 'PreconditionFailed',
  BadDigest = 'BadDigest',
  InvalidDigest = 'InvalidDigest',
  EntityTooLarge = 'EntityTooLarge',
  UnImplemented = 'UnImplemented',
  MethodNotAllowed = 'MethodNotAllowed',
  InvalidAccessKeyId = 'InvalidAccessKeyId',
  InvalidSecurityToken = 'InvalidSecurityToken',
  ContentSHA256Mismatch = 'ContentSHA256Mismatch',
  ExceedQPSLimit = 'ExceedQPSLimit',
  ExceedRateLimit = 'ExceedRateLimit',
  NoSuchCORSConfiguration = 'NoSuchCORSConfiguration',
  NoSuchMirrorConfiguration = 'NoSuchMirrorConfiguration',
  NoSuchWebsiteConfiguration = 'NoSuchWebsiteConfiguration',
  MissingRequestBody = 'MissingRequestBodyError',
  BucketAlreadyOwnedByYou = 'BucketAlreadyOwnedByYou',
  NoSuchBucketPolicy = 'NoSuchBucketPolicy',
  PolicyTooLarge = 'PolicyTooLarge',
  MalformedPolicy = 'MalformedPolicy',
  InvalidKey = 'InvalidKey',
  MirrorFailed = 'MirrorFailed',
  Timeout = 'Timeout',
  OffsetNotMatched = 'OffsetNotMatched',
  NotAppendable = 'NotAppendable',
  ContextCanceled = 'ContextCanceled',
  InternalError = 'InternalError',
  TooManyRequests = 'TooManyRequests',
  TimeOut = 'TimeOut',
  ConcurrencyUpdateObjectLimit = 'ConcurrencyUpdateObjectLimit',
  DuplicateUpload = 'DuplicateUpload',
  DuplicateObject = 'DuplicateObject',
  InvalidVersionId = 'InvalidVersionId',
  StorageClassNotMatch = 'StorageClassNotMatch',
  UploadStatusNotUploading = 'UploadStatusNotUploading',
  PartSizeNotMatch = 'PartSizeNotMatch',
  NoUploadPart = 'NoUploadPart',
  PartsLenInvalid = 'PartsLenInvalid',
  PartsIdxSmall = 'PartsIdxSmall',
  PartSizeSmall = 'PartSizeSmall',
  PrefixNotNextKeyPrefix = 'PrefixNotNextKeyPrefix',
  InvalidPart = 'InvalidPart',
  InvalidPartOffset = 'InvalidPartOffset',
  MismatchObject = 'MismatchObject',
  UploadStatusMismatch = 'UploadStatusMismatch',
  CompletingStatusNoExpiration = 'CompletingStatusNoExpiration',
  Found = 'Found',
  InvalidRedirectLocation = 'InvalidRedirectLocation',
}
