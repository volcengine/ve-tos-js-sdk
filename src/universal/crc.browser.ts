export class CRC {
  reset() {}

  async updateBlob() {}

  async finalBlob() {}

  update(_value: string | Buffer | ArrayBuffer | undefined) {}

  final() {}

  toString() {
    return '';
  }

  equalsTo(_crc64: string) {
    return true;
  }
}
