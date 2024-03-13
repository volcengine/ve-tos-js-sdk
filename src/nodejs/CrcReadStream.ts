import { Transform } from 'stream';
import { CRCCls } from '../universal/crc';

function createReadCbTransformer(readCb: (chunk: Buffer) => void) {
  return new Transform({
    async transform(chunk, _encoding, callback) {
      readCb(chunk);
      this.push(chunk);
      callback();
    },
  });
}

export function createCrcReadStream(
  stream: NodeJS.ReadableStream,
  crc: CRCCls
) {
  const readCbTransformer = createReadCbTransformer((chunk: Buffer) =>
    crc.update(chunk)
  );
  stream.on('error', (err) => {
    readCbTransformer.destroy(err);
  });
  return stream.pipe(readCbTransformer);
}
