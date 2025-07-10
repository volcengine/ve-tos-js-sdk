import { Transform } from 'stream';
import { pipeStreamWithErrorHandle } from '../utils';

function createReadNCbTransformer(readCb: (n: number) => void) {
  return new Transform({
    async transform(chunk, _encoding, callback) {
      const chunkSize = chunk.length;
      readCb(chunkSize);
      this.push(chunk);
      callback();
    },
  });
}

export function createReadNReadStream(
  stream: NodeJS.ReadableStream,
  readCb: (n: number) => void
) {
  const readCbTransformer = createReadNCbTransformer(readCb);
  return pipeStreamWithErrorHandle(
    stream,
    readCbTransformer,
    'createReadNReadStream'
  );

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
