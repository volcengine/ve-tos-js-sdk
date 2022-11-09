import TosClientError from '../TosClientError';
import { isBuffer } from '../utils';

function makeTable() {
  // The ECMA polynomial, defined in ECMA 182.
  const POLY = 0xc96c5795d7870f42n;
  const table: bigint[][] = [];

  for (let i = 0; i < 8; i++) {
    table[i] = [];
  }

  let crc = 0n;

  for (let i = 0; i < 256; i++) {
    crc = BigInt(i);

    for (let j = 0; j < 8; j++) {
      if (crc & 1n) {
        crc = POLY ^ (crc >> 1n);
      } else {
        crc = crc >> 1n;
      }
    }

    table[0][i] = crc;
  }

  for (let i = 0; i < 256; i++) {
    crc = table[0][i];

    for (let j = 1; j < 8; j++) {
      const index = Number(crc & 0xffn);
      crc = table[0][index] ^ (crc >> 8n);
      table[j][i] = crc;
    }
  }

  return table;
}

function stringToBytes(string: string): Uint8Array {
  // decode string to utf8 code
  const utf8CodeString = unescape(encodeURIComponent(string));

  const bytes: Uint8Array = new Uint8Array(utf8CodeString.length);

  for (let index = 0; index < utf8CodeString.length; ++index) {
    bytes[index] = utf8CodeString.charCodeAt(index);
  }

  return bytes;
}

const ecmaTable = makeTable();
const initCRC = ~BigInt(0) & 0xffffffffffffffffn;

export class CRC {
  private crc = initCRC;
  private remains = new Uint8Array();
  private isFinal = false;
  private blobUpdatePromise = Promise.resolve();

  reset() {
    this.crc = initCRC;
    this.remains = new Uint8Array();
    this.isFinal = false;
    this.blobUpdatePromise = Promise.resolve();
  }

  // updateBlob is very slow in browser
  async updateBlob(value: Blob) {
    // avoid memory boat
    const unit = 1 * 1024 * 1024;
    this.blobUpdatePromise = new Promise(async resolve => {
      let i = 0;
      const handleOne = async () => {
        this.update(
          await value.slice(i, Math.min(value.size, i + unit)).arrayBuffer()
        );
        i += unit;
      };

      const funcOne = async () => {
        if (i >= value.size) {
          resolve();
          return;
        }

        await handleOne();
        setTimeout(funcOne, 0);
      };

      setTimeout(funcOne, 0);
    });
  }

  async finalBlob() {
    await this.blobUpdatePromise;
    this._final();
  }

  private update8Bytes(bytes: Uint8Array) {
    let crc = this.crc;
    crc ^=
      BigInt(bytes[0]) |
      (BigInt(bytes[1]) << 8n) |
      (BigInt(bytes[2]) << 16n) |
      (BigInt(bytes[3]) << 24n) |
      (BigInt(bytes[4]) << 32n) |
      (BigInt(bytes[5]) << 40n) |
      (BigInt(bytes[6]) << 48n) |
      (BigInt(bytes[7]) << 56n);

    this.crc =
      ecmaTable[7][Number(crc & 0xffn)] ^
      ecmaTable[6][Number((crc >> 8n) & 0xffn)] ^
      ecmaTable[5][Number((crc >> 16n) & 0xffn)] ^
      ecmaTable[4][Number((crc >> 24n) & 0xffn)] ^
      ecmaTable[3][Number((crc >> 32n) & 0xffn)] ^
      ecmaTable[2][Number((crc >> 40n) & 0xffn)] ^
      ecmaTable[1][Number((crc >> 48n) & 0xffn)] ^
      ecmaTable[0][Number(crc >> 56n)];
  }

  private checkFinal() {
    if (this.isFinal) {
      throw new TosClientError(
        "TOS CRC don't call update() and final() after called final()"
      );
    }
  }

  update(value: string | Buffer | ArrayBuffer | undefined) {
    this.checkFinal();

    let bytes = new Uint8Array();
    if (typeof value === 'string') {
      bytes = stringToBytes(value);
    } else if (isBuffer(value)) {
      bytes = new Uint8Array(value);
    } else if (value instanceof ArrayBuffer) {
      bytes = new Uint8Array(value);
    }

    const { remains } = this;

    if (remains.length > 0) {
      if (remains.length + bytes.length < 8) {
        const newRemains = new Uint8Array(remains.length + bytes.length);
        newRemains.set(remains, 0);
        newRemains.set(bytes, remains.length);
        this.remains = newRemains;
        return;
      }

      // handle first 8 bytes
      const first8bytes = new Uint8Array(8);
      first8bytes.set(remains, 0);
      first8bytes.set(bytes.slice(0, 8 - remains.length), remains.length);
      this.update8Bytes(first8bytes);
      bytes = bytes.slice(8 - remains.length);
      this.remains = new Uint8Array();
    }

    while (bytes.length > 8) {
      this.update8Bytes(bytes);
      bytes = bytes.slice(8);
    }
    this.remains = bytes;
  }

  private _final() {
    this.checkFinal();
    this.isFinal = true;
    let { crc, remains: bytes } = this;
    for (let i = 0; i < bytes.length; i++) {
      const lower = Number(crc & 0xffn);
      const index = lower ^ bytes[i];
      crc = ecmaTable[0][index] ^ (crc >> 8n);
    }
    this.crc = ~crc & 0xffffffffffffffffn;
  }

  final() {
    this._final();
  }

  toString(): string {
    return this.crc.toString();
  }

  equalsTo(crc64: string): boolean {
    return this.toString() === crc64;
  }
}
