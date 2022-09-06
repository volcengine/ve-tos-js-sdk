import { Readable } from 'stream';

export class EmitReadStream extends Readable {
  lastPos = 0;
  isEnd = false;

  constructor(
    public underlying: Readable | Buffer | Blob,
    private totalSize: number,
    private readCb: (n: number) => void
  ) {
    super();
    if (underlying instanceof Readable) {
      underlying.on('data', d => {
        readCb(d.length);
      });
      underlying.pause();

      // TODO: yarn test will timeout
      // underlying.on('end', () => {
      //   this.isEnd = true;
      // });
    }
  }

  _read(n: number) {
    const { underlying } = this;
    let actualN = Math.min(n, this.totalSize - this.lastPos);

    if (underlying instanceof Readable) {
      throw Error('use `this.stream()` instead');
    }
    // TODO: yarn test will timeout
    // if (underlying instanceof Readable) {
    //   if (this.isEnd) {
    //     this.push(null);
    //     return;
    //   }

    //   underlying.once('readable', () => {
    //     const buf = underlying.read(n);
    //     if (buf !== null) {
    //       // buf === null means end
    //       if (buf !== undefined && 'length' in buf) {
    //         actualN = buf.length;
    //       } else {
    //         // maybe warning, non-expect
    //       }
    //     }
    //     this.push(buf);

    //     if (actualN) {
    //       this.lastPos += actualN;
    //       this.readCb(actualN);
    //     }
    //   });
    //   return;
    // }

    if (this.lastPos >= this.totalSize) {
      this.push(null);
      return;
    }

    this.push(underlying.slice(this.lastPos, this.lastPos + actualN));
    this.lastPos += actualN;
    this.readCb(actualN);
  }

  stream(): Readable {
    if (this.underlying instanceof Readable) {
      return this.underlying;
    }
    return this;
  }
}
