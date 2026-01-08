import { AxiosAdapter } from 'axios';
import {
  ACLType,
  CannedType,
  PermissionType,
  StorageClassType,
} from './TosExportEnum';

export type Headers = { [key: string]: string | undefined };

export interface AclInterface {
  Owner: { ID: string };
  Grants: {
    Grantee: {
      ID?: string;
      DisplayName?: string;
      Type: string;
      Canned?: CannedType;
    };
    Permission: PermissionType;
  }[];
  /**
   * @private unstable property only for bucket ACL
   */
  BucketAclDelivered?: boolean;
  /**
   * @private unstable property only for object ACL
   */
  IsDefault?: boolean;
}

export type Acl = ACLType;
export type StorageClass = StorageClassType;

export type ServerSideEncryption = 'AES256';

export interface DataTransferStatus {
  /**
   * has read or wrote bytes
   */
  consumedBytes: number;

  /**
   * totalBytes maybe 0 or -1.
   * `-1` means unkown totalBytes, for example when starting to download an object
   */
  totalBytes: number;

  /**
   * transferred bytes in this transfer
   */
  rwOnceBytes: number;

  type: DataTransferType;
}

export enum DataTransferType {
  Started = 1, // data transfer start
  Rw = 2, // one transfer
  Succeed = 3, // data transfer succeed
  Failed = 4, // data transfer failed
}

export type SupportObjectBody =
  | File
  | Blob
  | Buffer
  | NodeJS.ReadableStream
  | undefined;

export type StringKeys<T> = Extract<
  { [K in keyof T]: T[K] extends string | undefined ? K : never }[keyof T],
  string
>;

export interface IRateLimiter {
  Acquire: (want: number) => Promise<{
    ok: boolean;
    /**
     * unit: milliseconds
     */
    timeToWait: number;
  }>;
}

export interface TosClientCommonOptions {
  accessKeyId: string;
  accessKeySecret: string;
  stsToken?: string;
  //bucket?: string;
  endpoint?: string;
  /**
   * default value: true
   * when using proxyHost&proxyPort, it needs to be set to false
   */
  secure?: boolean;
  region: string;

  /**
   * proxy for web, use it with the middleware of `./proxy`
   */
  proxy?:
    | string
    | {
        url: string;
        needProxyParams?: boolean;
      };
  /**
   * proxy to general http proxy server, this feature doesn't work in browser environment.
   * only support http proxy server.
   * proxyHost and proxyPort are required if the proxy function works.
   * HINT: need set `secure` field false
   */
  proxyHost?: string;
  proxyPort?: number;
  // username and password don't be supported currently
  // proxyUsername?: string;
  // proxyPassword?: string;

  /**
   * default value: true
   */
  enableVerifySSL?: boolean;

  /**
   * default value: true
   */
  //autoRecognizeContentType?: boolean;

  /**
   * unit: ms
   * default value: 120s
   * disable if value <= 0
   */
  requestTimeout?: number;

  /**
   * unit: ms
   * default value: 10s
   * disable if value <= 0
   */
  connectionTimeout?: number;

  /**
   * default value: 1024
   */
  maxConnections?: number;

  /**
   * unit: ms
   * default value: 30s
   */
  idleConnectionTime?: number;

  /**
   * default value: 3
   *
   * disable if value <= 0
   */
  maxRetryCount?: number;

  // TODO: need more efficient way, 1min for 10M currently
  /**
   * default value: false
   *
   * CRC executed by js is slow currently, it's default value will be true if it is fast enough.
   */
  //enableCRC?: boolean;

  /**
   * set request adapter to send request.
   */
  requestAdapter?: AxiosAdapter;

  /**
   * default value: false  ${bucket}.${endpoint}
   * if true request will not combine `${bucket}.${endpoint}`
   */
  //isCustomDomain?: boolean;

  /**
   * @private unstable option: false | true | undefined
   * default value: undefined
   * true:
   * Allow SDK to internally catch server errors for 404 and return default values
   * Allow SDK to internally change some put methods to delete methods when pass empty value
   */
  enableOptimizeMethodBehavior?: boolean;
  /**
   * @private unstable option
   */
  //forcePathStyle?: boolean;

  userAgentProductName?: string;
  userAgentSoftName?: string;
  userAgentSoftVersion?: string;
  userAgentCustomizedKeyValues?: Record<string, string>;
}
