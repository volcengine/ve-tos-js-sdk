import * as cryptoBrowser from './crypto.browser';
import * as cryptoNode from './crypto.node';

interface CryptoModule {
  hmacSha256: (
    key: string,
    message: string,
    decoding?: 'base64' | 'hex'
  ) => string;
  hashSha256: (message: string, decoding?: 'base64' | 'hex') => string;
  hashMd5: (message: string, decoding?: 'base64' | 'hex') => string;
}

let crypto = (null as unknown) as CryptoModule;
if (process.env.TARGET_ENVIRONMENT === 'node') {
  crypto = (cryptoNode as unknown) as CryptoModule;
} else {
  crypto = (cryptoBrowser as unknown) as CryptoModule;
}

const { hmacSha256, hashSha256, hashMd5 } = crypto;

export { hmacSha256, hashSha256, hashMd5 };
