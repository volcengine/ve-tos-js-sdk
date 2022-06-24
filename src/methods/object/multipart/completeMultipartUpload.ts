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

export interface CompleteMultipartUploadOutput {
  Bucket: string;
  Key: string;
  ETag: string;
  Location: string;
  VersionID?: string;
  HashCrc64ecma?: number;
}

export async function completeMultipartUpload(
  this: TOSBase,
  input: CompleteMultipartUploadInput
) {
  return this.fetchObject<CompleteMultipartUploadOutput>(
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
    },
    {
      handleResponse(response) {
        return {
          ...response.data,
          VersionID: response.headers['x-tos-version-id'],
        };
      },
    }
  );
}
