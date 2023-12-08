import TOSBase from '../base';

export interface RenameObjectInput {
  bucket?: string;
  key: string;
  newKey: string;
}

export async function renameObject(this: TOSBase, input: RenameObjectInput) {
  return this._fetchObject<undefined>(
    input,
    'PUT',
    { rename: '', name: input.newKey },
    {},
    ''
  );
}

export default renameObject;
