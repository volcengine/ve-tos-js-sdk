# Volcengine Object Storage(TOS) JS SDK

## Install

### yarn

```shell
yarn add @volcengine/tos-sdk
```

### npm

```shell
npm i @volcengine/tos-sdk
```

## Use JS SDK

- Import

  ```js
  // use import
  import TOS from '@volcengine/tos-sdk';

  // use require
  const { TOS } = require('@volcengine/tos-sdk');
  ```

- Create a client

  ```js
  const client = new TOS({
    accessKeyId: 'Your Access Key',
    accessKeySecret: 'Your Secret Key',
    region: 'cn-beijing',
  });
  ```

- More example, see test and example folder

## Changelog

Detailed changes for each release are documented in the [CHANGELOG.md](https://github.com/volcengine/ve-tos-js-sdk/blob/main/CHANGELOG.md).
