import cryptoHmacSha256 from 'crypto-js/hmac-sha256';
import cryptoHashSha256 from 'crypto-js/sha256';
import cryptoHashMd5 from 'crypto-js/md5';
import cryptoEncBase64 from 'crypto-js/enc-base64';
import cryptoEncHex from 'crypto-js/enc-hex';

function decode(v: any, decoding?: 'base64' | 'hex'): string {
  if (!decoding) {
    return v;
  }

  return v.toString(decoding === 'base64' ? cryptoEncBase64 : cryptoEncHex);
}

export const hmacSha256 = function hmacSha256(
  key: string,
  message: string,
  decoding?: 'base64' | 'hex'
) {
  return decode(cryptoHmacSha256(message, key), decoding);
};

export const hashSha256 = function hashSha256(
  message: string,
  decoding?: 'base64' | 'hex'
) {
  return decode(cryptoHashSha256(message), decoding);
};

export const hashMd5 = function hashMd5(
  message: string,
  decoding?: 'base64' | 'hex'
) {
  return decode(cryptoHashMd5(message), decoding);
};
