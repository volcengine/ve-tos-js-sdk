import TOSBase from '../../base';

export interface AbortMultipartUploadInput {
  bucket?: string;
  key: string;
  uploadId: string;
}

export async function abortMultipartUpload(
  this: TOSBase,
  input: AbortMultipartUploadInput
) {
  return this._fetchObject<undefined>(
    input,
    'DELETE',
    {
      uploadId: input.uploadId,
    },
    {}
  );
}
