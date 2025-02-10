import { fillRequestHeaders, normalizeHeadersKey } from '../../utils';
import TOSBase from '../base';

export interface RenameObjectInput {
  bucket?: string;
  key: string;
  newKey: string;
  recursiveMkdir?: boolean;
  forbidOverwrite?: boolean;
  headers?: {
    [key: string]: string | undefined;
  };
}

export async function renameObject(this: TOSBase, input: RenameObjectInput) {
  input.headers = input.headers || {};
  fillRequestHeaders(input, ['recursiveMkdir', 'forbidOverwrite']);
  return this._fetchObject<undefined>(
    input,
    'PUT',
    { rename: '', name: input.newKey },
    input.headers,
    ''
  );
}

export default renameObject;
