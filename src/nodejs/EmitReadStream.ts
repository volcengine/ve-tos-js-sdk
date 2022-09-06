import { Readable } from 'stream';

export class EmitReadStream extends Readable {
  lastPos = 0;

  constructor(
    public underlying: Readable | Buffer | Blob,
    private totalSize: number,
    private readCb: (n: number) => void
  ) {
    super();
  }

  _read(n: number) {
    const { underlying } = this;
    let actualN = Math.min(n, this.totalSize - this.lastPos);
    if (underlying instanceof Readable) {
      const buf = underlying.read(n);
      if (buf != null && 'length' in buf) {
        actualN = buf.length;
      } else {
        // maybe warning, non-expect
      }
      this.push(buf);
      this.lastPos += actualN;
      this.readCb(actualN);
      return;
    }

    if (this.lastPos >= this.totalSize) {
      this.push(null);
      return;
    }

    this.push(underlying.slice(this.lastPos, this.lastPos + actualN));
    this.lastPos += actualN;
    this.readCb(actualN);
  }
}
