import * as cryptoBrowser from './crypto.browser';
import * as cryptoNode from '../nodejs/crypto.nodejs';

interface CryptoModule {
  hmacSha256: (
    key: string,
    message: string,
    decoding?: 'base64' | 'hex'
  ) => string;
  hashSha256: (message: string, decoding?: 'base64' | 'hex') => string;
  hashMd5: (message: string | Buffer, decoding?: 'base64' | 'hex') => string;
  parse: (str: string, encoding: 'utf-8' | 'base64' | 'hex') => string;
  stringify: (str: string, decoding: 'utf-8' | 'base64' | 'hex') => string;
}

let crypto = (null as unknown) as CryptoModule;
if (process.env.TARGET_ENVIRONMENT === 'node') {
  crypto = (cryptoNode as unknown) as CryptoModule;
} else {
  crypto = (cryptoBrowser as unknown) as CryptoModule;
}

const { hmacSha256, hashSha256, hashMd5, parse, stringify } = crypto;

export { hmacSha256, hashSha256, hashMd5, parse, stringify };
