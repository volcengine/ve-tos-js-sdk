import { StorageClass, ServerSideEncryption } from '../../interface';
import TOSBase from '../base';

export interface CopyObjectInput {
  bucket?: string;
  key: string;
  headers?: {
    [key: string]: string | undefined;
    ['x-tos-copy-source']?: string;
    ['x-tos-acl']?: string;
    ['x-tos-copy-source-if-match']?: string;
    ['x-tos-copy-source-if-modified-since']?: string;
    ['x-tos-copy-source-if-none-match']?: string;
    ['x-tos-copy-source-if-unmodified-since']?: string;
    ['x-tos-copy-source-server-side-encryption-customer-algorithm']?: string;
    ['x-tos-copy-source-server-side-encryption-customer-key']?: string;
    ['x-tos-copy-source-server-side-encryption-customer-key-MD5']?: string;
    ['x-tos-grant-full-control']?: string;
    ['x-tos-grant-read']?: string;
    ['x-tos-grant-read-acp']?: string;
    ['x-tos-metadata-directive']?: string;
    ['x-tos-website-redirect-location']?: string;
    ['x-tos-storage-class']?: StorageClass;
    ['x-tos-server-side-encryption']?: ServerSideEncryption;
  };
}

export async function copyObject(this: TOSBase, input: CopyObjectInput) {
  return this.fetchObject<undefined>(input, 'PUT', {}, input.headers || {});
}

export default copyObject;
