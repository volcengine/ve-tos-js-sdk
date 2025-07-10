# Changelog of @volcengine/tos-sdk

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.7.4] - 2025-07-10

### Breaking Changes
- **Bucket name validation moved to client-side**:
  - **Affected scope**: All users creating or modifying buckets.
  - **Details**:
    - Previously, bucket name validation was handled by the server. Invalid names would trigger `TosServerError`.
    - Now the client validates bucket names first. If invalid, it throws `TosClientError` directly, reducing network requests.
  - **Migration guide**:
    ```diff
    // Old code (relied on server validation)
    try {
      await client.headBucket("invalid-bucket!");
    } catch (e) {
      if (e instanceof TosServerError) {
        console.error("Server returned error:", e.message);
      }
    }

    // New code (handle client validation errors)
    try {
      await client.headBucket("invalid-bucket!");
    } catch (e) {
    -  if (e instanceof TosServerError) {
    +  if (e instanceof TosClientError) {
        console.error("Client validation failed:", e.message);
      } else if (e instanceof TosServerError) {
        console.error("Server returned error:", e.message);
      }
    }

### Added

- retry if statusCode is 408
- optimize error handlin logic of `uploadFile`

### Fixed

- fix missed content-type header in `setObjectMeta` method and in browser environment
- fix `replaceAll is not a function` in nodejs environment

## [2.7.4] - 2025-02-10

### Added

- enhance the `user-agent` request header in node.js environment, includes: os_type, arch, nodejs version etc

### Fixed

- feat add symlink
- fix progress of `downloadFile` will be greater than 1
- fix crc64 of `downloadFile|uploadFile` might be calculated incorrectly when taskNum bigger than 1
- fix `getObjectToFile` don't throw error when stream emits `'error'` event

### Changed

- change `GetBucketMirrorBack` method, the `PublicSource` attribute of type `MirrorBackRule` to optional
- Add an optional field `HttpMethod` to the Condition field of `MirrorBackRule`

## [2.7.3] - 2024-07-25

### Fixed

- uploadFile by ssec

## [2.7.2] - 2024-07-25

don't use this version

## [2.7.1] - 2024-04-15

### Fixed

- fix wrong MirrorBackRule interface
- deprecated `(get|put)BucketNotification` methods to modify bucket notification
- add `(get|put)BucketNotificationType2` methods to modify bucket notification

### Added

- Bucket policy supports exclusion logic
- `putBucketLifecycle|getBucketLifecycle` add `AllowSameActionOverlap` field
- Added attributes of `LifecycleRule`
- export `MirrorBackRule`
- `ReplicationRule` add `AccessControlTranslation` field
- `headObject|getObjectV2` support `RestoreInfo`,`ReplicationStatus` response field
- `createBucket` support `projectName` field
- `headBucket` support `ProjectName` response field
- `putBucketLifecycle|getBucketLifecycle` support `Filter` and `NoncurrentDate` field
- added `deleteBucketEncryption` | `getBucketEncryption` |`putBucketEncryption` methods

## [2.6.15] - 2024-03-26

### Fixed

- remove the code `for await` by tree shaking

## [2.6.14] - 2024-03-13

### Added

- optimize crc64 in nodejs by asm.js. Now `putObject`, `uploadPart`, `uploadFile`, `appendObject`, `getObjectV2` and `downloadFile` support crc64

## [2.6.12] - 2024-02-22

### Added

- deprecate passing a object to `checkpoint` parameter in node.js environment
- export `DataTransferType`, `DownloadEventType`, `ResumableCopyEventType` and `UploadEventType` enum types
- `getObject` method supports `dataTransferStatusChange` and `progress` params
- `dataTransferStatusChange` param of `downloadFile` method aligns network flow rate instead of updating after part download
- `uploadPartCopy` method supports `srcBucket`, `srcKey` and `srcVersionID` params

### Fixed

- set `axiosInst` default values to avoid being affected by the global default values of axios
- fix `appendObject` method
- fix `getObjectV2` method to support range download

## [2.6.11] - 2023-12-08

### Added

- add `fetchObject`, `putFetchTask` and `renameObject` method
- add `copySourceRange` option for `UploadPartCopy` method
- export more enum types, eg: `LifecycleStatusType`, `RedirectType` and `VersioningStatusType` etc
- `putObjectAcl` method supports `aclBody` param

### Fixed

- fix image process and video process
- fix http proxy when tos endpoint is `https`
- throw `TosServerError` if server responses error in `HEAD` request
- fix `ruleId` param of `getBucketReplication` method

## [2.6.10] - 2023-11-13

### Fixed

- fix usage of miniprogram environment

## [2.6.9] - 2023-11-10

### Fixed

- fix version

## [2.6.8] - 2023-11-10

### Fixed

- move some packages to devDep from dep

## [2.6.7] - 2023-11-08

### Fixed

- `listObjectsType2` now will try to list objects until get maxKeys Objects correct

## [2.6.6] - 2023-10-27

### Fixed

- update `crypto-js` to `4.2.0` for fixing security vulnerability

## [2.6.5] - 2023-10-19

### Added

- `idleConnectionTime` field. change default value from 60s to 30s
- add more comment when use proxyHost field

## [2.6.3] - 2023-09-23

### Fixed

- fixed TOS register error in browser env

## [2.6.2] - 2023-09-19

### Fixed

- export `createDefaultRateLimiter` correct

## [2.6.1] - 2023-09-19

### Added

- `getObjectV2/getObjectToFile/putObject/uploadPart/copyObject/uploadPartCopy/appendObject/uploadFile/downloadFile/resumableCopyObject` methods support server side traffic limit field `trafficLimit`
- `getObjectV2/getObjectToFile/putObject/uploadPart/appendObject/uploadFile/downloadFile` methods support client side rate limit field `rateLimiter`. only support in node environment
- TOS Client Init Options support `isCustomDomain`. default value is false. if set true, request will not add bucketName before endpoint.
- `getPreSignedUrl/preSignedPolicyURL` support `isCustomDomain` field
- `CompleteMultipartUpload/putObject` support `callback|callbackVar|CallbackResult` fields
- `listObjectsType2` now will try to list objects until get maxKeys Objects by default
- `listObjectsType2` support `listOnlyOnce` field. default value is `false`
- `listObjectsType2` default `maxKeys` field value is 1000
- `downloadFile` support crc64

### Fixed

- `preSignedPolicyURL` will not encode character `/`

## [2.6.0] - 2023-08-21

### Fixed

- fix sdk has a dependency on a high-risk version of axios

### Added

- `completeMultipartUpload` support `completeAll` field
- `getObjectV2` support `process` field
- `putBucketMirrorBack` add `FixedEndpoint` field
- `putBucketNotification` add `rocketMQConfigurations` field
- `getBucketNotification` add `RocketMQConfigurations` field
- add `(get|put|delete)BucketRename` methods to rename bucket
- add `restoreObject` method to restore object
- `uploadPartCopy` support `SSEC`
- `describeJob` add `TOSRestoreObject` field
- `headObject` add `HeadObjectOutputReplicationStatusType`
- `listJobs` remove default value for `jobStatuses`
- Inventory add `ReplicationStatus`

## [2.5.6] - 2023-07-24

### Fixed

- fix UMD bundle and support special runtime environment

## [2.5.5] - 2023-07-06

### Added

- `ACLType` enum add `ACLBucketOwnerEntrusted`
- `GetObjectAclOutput` support `BucketOwnerEntrusted` field
- S3 endpoint will throw TosClientError
- downgrade `type-fest` version

## [2.5.4] - 2023-07-03

### Added

- `putBucketCORS`,`getBucketCORS` support `ResponseVary` field
- change `getBucketCORS` empty error to normal data

### Fixed

- Aligning horizontal design for the `listObjectsType2` API.

## [2.5.3] - 2023-07-01

### Fixed

- move type-fest from devDependencies to dependencies.

## [2.5.2] - 2023-06-26

### Added

- add `(get|put|delete|list)BucketInventory` private methods to modify bucket Inventory
- add `(describe|create|delete|list)Job`,`updateJobStatus`, `updateJobPriority` private methods to modify batch jobs
- add `(get|put|delete)BucketTagging` private methods to modify bucket Tagging
- add `(get|put)BucketPayByTraffic` private methods to modify bucket PayByTraffic
- change `getBucketReplication|getBucketCustomDomain|getBucketInventory|getBucketMirrorBack|getBucketNotification|getBucketRealTimeLog|getBucketRealTimeLog|getBucketWebsite` methods empty error to normal data
- add `TosClient` export

### Fixed

- fixed: `uploadFile`,`resumableCopyObject` correct support relative checkpoint filepath
- fixed: `uploadFile` change default checkpoint filename
- fixed: ensure directory exist when write checkpoint file

## [2.5.1] - 2023-06-14

### Added

- modify updateChangelog.js
- proxy-middleware support modify protocol

## [2.5.0] - 2023-06-13

### Added

- add `getBucketLocation` method
- add `listObjectsType2` method
- add `putBucketStorageClass` method
- add `(get|put|delete)BucketCORS` methods to modify bucket CORS
- add `(get|put|delete)BucketLifecycle` methods to modify bucket lifecycle
- add `(get|put|delete)BucketMirrorBack` methods to modify bucket MirrorBack
- add `(get|put|delete)ObjectTagging` methods to modify object tagging
- add `COLD_ARCHIVE`,`INTELLIGENT_TIERING` storage class
- add `(get|put|delete)BucketReplication` methods to modify bucket replication
- add `(get|put|delete)BucketWebsite` methods to modify bucket website
- add `(get|put)BucketNotification` methods to modify bucket notification
- add `(get|put|delete)BucketCustomDomain` methods to modify bucket customDomain
- add `(get|put|delete)BucketRealTimeLog` methods to modify bucket realTimeLog

## [2.1.28] - 2023-05-30

### Fixed

- support new object name validate rule
- `appendObject` will return right result
- `uploadPartFromFile` get right file end

## [2.1.27] - 2023-03-13

### Fixed

- `resumableCopyObject` supports `serverSideEncryption` and custom headers.

## [2.1.26] - 2023-02-23

### Added

- add more header params in first level for convenience

## [2.1.25] - 2023-02-16

### Fixed

- fix: exist `wx` global variable if import wx js sdk

## [2.1.24] - 2023-02-16

### Fixed

- fix: error if axios rejected

## [2.1.23] - 2023-02-07

### Added

- support uniapp and miniprogram environments
- add `requestAdapter` option for other run environments

## [2.1.22] - 2023-01-29

### Fixed

- fix: `deleteObject` doesn't return result

## [2.1.21] - 2023-01-05

### Fixed

- fix: `resumableCopyObject` doesn't pass headers to server

## [2.1.20] - 2022-12-08

### Added

- add `downloadFile` method

## [2.1.19] - 2022-11-25

### Added

- add `alternativeEndpoint` option to `getPreSignedUrl` method

## [2.1.18] - 2022-11-19

### Added

- add `preSignedPolicyURL` method

## [2.1.17] - 2022-11-10

### Fixed

- encode the object key of `x-tos-copy-source` header when the object'size is 0

## [2.1.16] - 2022-11-09

### Fixed

- remove the bigint in browser environment

## [2.1.15] - 2022-11-09

### Added

- add log for nodejs and browser

### Fixed

- encode the object key of `x-tos-copy-source` header

## [2.1.14] - 2022-11-07

### Added

- disable request redirect for 3xx response status code
- support crc64
- add `(get|put)BucketVersioning` methods to modify bucket versioning

### Fixed

- set user-agent request header

## [2.1.13] - 2022-10-30

### Added

- proxy to general proxy server in node.js environment

## [2.1.12] - 2022-10-17

### Fixed

- fix: error "URI malformed" if source key includes multi code points character

## [2.1.11] - 2022-10-13

### Fixed

- fix: wrong md5 if uploading non-ascii file by calling `uploadFile` method

## [2.1.10] - 2022-10-13

### Added

- add `enableContentMD5` for `uploadFile` method

## [2.1.9] - 2022-10-10

### Fixed

- fix: throw signature error if header's value contains chinese

## [2.1.8] - 2022-10-10

### Fixed

- fix: invalid object name when object length is greater than 1

## [2.1.7] - 2022-10-09

### Fixed

- fix `@/utils` not found error

## [2.1.6] - 2022-09-29

### Added

- add `resumableCopyObject` method which can copy object which is bigger than 5GiB
- add `(get|put|delete)BucketPolicy` methods to modify bucket policy

## [2.1.5] - 2022-09-28

### Fixed

- fix: uploadFile throw error while uploading an empty file in nodejs

## [2.1.4] - 2022-09-28

### Fixed

- fix: body is empty if retrying to upload a stream or file in nodejs
- modify default `requestTimeout` to 120s

## [2.1.3] - 2022-09-14

### Fixed

- `uploadFile` method throw error in browser environment

## [2.1.2] - 2022-09-14

### Added

- `getObjectV2` method supports `buffer` in Node.js environment
- `uploadFile` method supports `dataTransferStatusChange` option
- `uploadPart` method throws error when there is no etag in browser environment

## 2.1.1

### Feature Changes

- add `getObjectV2` method, default return stream

## 2.1.0

### Feature Changes

- encode/decode http headers
- add `getObjectToFile` method
- add `uploadPartFromFile` method

## 2.0.5

### Feature Changes

- add `putObjectFromFile` method
- add `progress` and `dataTransferStatusChange` for `putObject` method
- add `maxRetryCount` constructor option

## 2.0.4

### Feature Changes

- add `ARCHIVE_FR` storage class

## 2.0.3

### Feature Changes

- add getBucketAcl and putBucketAcl methods

## 2.0.2

### Patch Changes

- fix: this object doesn't exist after progress 100% while using uploadFile

## 2.0.1

### Patch Changes

- fix error of chinese object name

## 2.0.0

### Feature Changes

- rename `ResponseError` to `TosServerError`
- add `TosClientError`, many enum values
- add constructor params: `enableVerifySSL`, `autoRecognizeContentType`, `requestTimeout`, `connectionTimeout`, `maxConnections`, `idleConnectionTime`

### Patch Changes

- fix `NaN` value when `uploadFile` with an empty file

### Patch Changes

## 0.0.6

### Patch Changes

- fix: throw error in nodejs@v10/12

## 0.0.5

### Patch Changes

- ensure that `secure` is boolean

## 0.0.4

### Feature Changes

- add `CompleteMultipartUploadOutput` type
- add `acl` param for `createMultipartUpload`

### Patch Changes

- fix: `taskNum` of `uploadFile` does not work
- use `secure` when it's not nullish

## 0.0.3

### Feature Changes

- add `calculatePostSignature`
- add `contentDisposition` for `getPreSignedUrl`

### Patch Changes

- fix: build umd resource
- fix `uploadPart` in browser environment

## 0.0.2

### Feature Changes

- add `TOSServerCode`
- use `crypto-js` in browser environment

### Patch Changes

- fix TOS constructor's endpoint params
- remove `subdomain` param of `getPreSignedUrl` method

## 0.0.1

- first version
