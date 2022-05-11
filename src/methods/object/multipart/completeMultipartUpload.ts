import TOSBase from '../../base';

export interface CompleteMultipartUploadInput {
  bucket?: string;
  key: string;
  uploadId: string;
  parts: {
    eTag: string;
    partNumber: number;
  }[];
}

export async function completeMultipartUpload(
  this: TOSBase,
  input: CompleteMultipartUploadInput
) {
  return this.fetchObject<undefined>(
    input,
    'POST',
    {
      uploadId: input.uploadId,
    },
    {},
    {
      Parts: input.parts.map(it => ({
        ETag: it.eTag,
        PartNumber: it.partNumber,
      })),
    }
  );
}
