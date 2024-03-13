import { Readable } from 'stream';

export class Buffer2Stream extends Readable {
  lastPos = 0;

  constructor(private buf: Buffer) {
    super();
  }

  _read(n: number) {
    const totalSize = this.buf.length;
    let actualN = Math.min(n, totalSize - this.lastPos);

    if (this.lastPos >= totalSize) {
      this.push(null);
      return;
    }

    this.push(this.buf.slice(this.lastPos, this.lastPos + actualN));
    this.lastPos += actualN;
  }
}
