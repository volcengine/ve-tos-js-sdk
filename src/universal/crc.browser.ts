import TosClientError from '../TosClientError';

// not enabled in browser environment, because:
// 1. crcjs maybe make browser long task
// 2. the size of webassembly version's crc is a bit large, it's 1.2MB when uncompressed.
export class CRC {
  reset() {}

  async updateBlob(): Promise<string> {
    throw new TosClientError('Not implemented.(CRC may cause browser lag.)');
  }

  update(_value: Buffer): string {
    throw new TosClientError('Not implemented.(CRC may cause browser lag.)');
  }
}
