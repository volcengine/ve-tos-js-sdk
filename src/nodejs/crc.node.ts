import TosClientError from '../TosClientError';
import { crc64 } from 'tos-crc64-js';
export { combineCrc64 } from 'tos-crc64-js';

export class CRC {
  private value = '0';

  reset() {
    this.value = '0';
  }

  async updateBlob(): Promise<string> {
    throw new TosClientError('Not implemented in node.js environment.');
  }

  update(value: Buffer): string {
    this.value = crc64(value, this.value);
    return this.value;
  }

  getCrc64(): string {
    return this.value;
  }
}
