import { makeArrayProp, normalizeHeadersKey } from '../../utils';
import TOSBase from '../base';

const CommonQueryKey = 'tagging';

interface TagSet {
  Tags: {
    Key: string;
    Value: string;
  }[];
}

export interface PutObjectTaggingInput {
  bucket: string;
  key: string;
  versionId?: string;
  tagSet: TagSet;
}

export interface PutObjectTaggingOutput {}

export async function putObjectTagging(
  this: TOSBase,
  input: PutObjectTaggingInput
) {
  const { tagSet, versionId } = input;
  const headers = normalizeHeadersKey({
    versionId,
  });

  return this._fetchObject<PutObjectTaggingOutput>(
    input,
    'PUT',
    { [CommonQueryKey]: '', ...headers },
    {},
    {
      TagSet: tagSet,
    }
  );
}

export interface GetObjectTaggingInput {
  bucket: string;
  key: string;
  versionId?: string;
}

export interface GetObjectTaggingOutput {
  TagSet: TagSet;
}

export async function getObjectTagging(
  this: TOSBase,
  input: GetObjectTaggingInput
) {
  const { versionId } = input;
  const headers = normalizeHeadersKey({
    versionId,
  });
  const res = await this._fetchObject<GetObjectTaggingOutput>(
    input,

    'GET',
    { [CommonQueryKey]: '', ...headers },
    {}
  );
  makeArrayProp(res.data.TagSet)('Tags');
  return res;
}

export interface DeleteObjectTaggingInput {
  bucket: string;
  key: string;
  versionId?: string;
}

export interface DeleteObjectTaggingOutput {}

export async function deleteObjectTagging(
  this: TOSBase,
  input: DeleteObjectTaggingInput
) {
  const { versionId } = input;
  const headers = normalizeHeadersKey({
    versionId,
  });

  return this._fetchObject<DeleteObjectTaggingOutput>(
    input,
    'DELETE',
    { [CommonQueryKey]: '', ...headers },
    {}
  );
}
