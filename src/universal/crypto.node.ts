import crypto from 'crypto';

function digest(v: any, decoding?: 'base64' | 'hex'): string {
  if (!decoding) {
    return v.digest();
  }
  return v.digest(decoding);
}

export const hmacSha256 = function hmacSha256(
  key: string,
  message: string,
  decoding?: 'base64' | 'hex'
) {
  return digest(crypto.createHmac('sha256', key).update(message), decoding);
};

export const hashSha256 = function hashSha256(
  message: string,
  decoding?: 'base64' | 'hex'
) {
  return digest(crypto.createHash('sha256').update(message), decoding);
};

export const hashMd5 = function hashMd5(
  message: string,
  decoding?: 'base64' | 'hex'
) {
  return digest(crypto.createHash('md5').update(message), decoding);
};

export const parse = function parse(
  str: string,
  encoding: 'utf-8' | 'base64' | 'hex'
) {
  return Buffer.from(str, encoding);
};

export const stringify = function stringify(
  str: Buffer,
  decoding: 'utf-8' | 'base64' | 'hex'
) {
  return str.toString(decoding);
};
