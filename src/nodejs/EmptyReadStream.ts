import { Readable } from 'stream';

export class EmptyReadStream extends Readable {
  _read(): void {
    this.push(null);
  }
}
