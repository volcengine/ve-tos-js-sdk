# Changelog of @volcengine/tos-sdk

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
