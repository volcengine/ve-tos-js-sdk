import { Readable, Transform, TransformCallback } from 'stream';
import { isBuffer, isReadable } from '../utils';
import { read } from 'fs';

function createReadCbTransformer(readCb: (n: number) => void) {
  return new Transform({
    async transform(chunk, _encoding, callback) {
      const chunkSize = chunk.length;
      readCb(chunkSize);
      this.push(chunk);
      callback();
    },
  });
}

function createEmitReadStream(
  stream: NodeJS.ReadableStream,
  readCb: (n: number) => void
) {
  const readCbTransformer = createReadCbTransformer(readCb);
  stream.on('error', (err) => readCbTransformer.destroy(err));
  return stream.pipe(readCbTransformer);

  /**
   * Don't use the below code.
   *
   * 1. The readable stream will be flowing mode after adding a 'data' event listener to it.
   * 2. The stream will be paused after calling `pause()` method.
   * 3. The stream will not change to flowing mode when adding a 'data' event listener to it.
   */
  // stream.on('data', (d) => {
  //   readCb(d.length);
  // });
  // stream.pause();
}

export class EmitReadStream extends Readable {
  lastPos = 0;
  isEnd = false;
  newStream: NodeJS.ReadableStream | null = null;

  constructor(
    public underlying: NodeJS.ReadableStream | Buffer,
    private totalSize: number,
    private readCb: (n: number) => void
  ) {
    super();
    if (isReadable(underlying)) {
      this.newStream = createEmitReadStream(underlying, readCb);

      // TODO: yarn test will timeout
      // underlying.on('end', () => {
      //   this.isEnd = true;
      // });
    }
  }

  _read(n: number) {
    const { underlying } = this;
    let actualN = Math.min(n, this.totalSize - this.lastPos);

    if (isReadable(underlying)) {
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

  stream(): NodeJS.ReadableStream {
    if (isReadable(this.newStream)) {
      return this.newStream;
    }
    return this;
  }
}
