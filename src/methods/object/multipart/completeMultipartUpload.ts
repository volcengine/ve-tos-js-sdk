import TosClientError from '../../../TosClientError';
import TOSBase from '../../base';

export interface CompleteMultipartUploadInput {
  bucket?: string;
  key: string;
  uploadId: string;
  parts: {
    eTag: string;
    partNumber: number;
  }[];
  /**
   * when true `parts` param need to be empty array
   */
  completeAll?: boolean;
}

export type UploadedPart = {
  PartNumber: number;
  ETag: string;
};

export interface CompleteMultipartUploadOutput {
  Bucket: string;
  Key: string;
  ETag: string;
  Location: string;
  VersionID?: string;
  HashCrc64ecma?: number;
  /** the field has a value when completeAll is true */
  CompletedParts?: UploadedPart[];
}

export async function completeMultipartUpload(
  this: TOSBase,
  input: CompleteMultipartUploadInput
) {
  if (input.completeAll) {
    if (input.parts?.length > 0) {
      throw new TosClientError(
        `Should not specify both 'completeAll' and 'parts' params.`
      );
    }
    return this.fetchObject<CompleteMultipartUploadOutput>(
      input,
      'POST',
      {
        uploadId: input.uploadId,
      },
      {
        'x-tos-complete-all': 'yes',
      },
      undefined,
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

  return this.fetchObject<CompleteMultipartUploadOutput>(
    input,
    'POST',
    {
      uploadId: input.uploadId,
    },
    {},
    {
      Parts: input.parts.map((it) => ({
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
