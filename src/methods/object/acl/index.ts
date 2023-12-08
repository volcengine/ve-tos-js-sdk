import { Acl, AclInterface } from '../../../interface';
import { fillRequestHeaders, normalizeHeadersKey } from '../../../utils';
import TOSBase from '../../base';

export interface GetObjectAclInput {
  bucket?: string;
  key: string;
  versionId?: string;
}

export type ObjectAclBody = AclInterface & {
  BucketOwnerEntrusted?: boolean;
};

export type GetObjectAclOutput = ObjectAclBody;

export async function getObjectAcl(
  this: TOSBase,
  input: GetObjectAclInput | string
) {
  const normalizedInput = typeof input === 'string' ? { key: input } : input;
  const query: Record<string, any> = { acl: '' };
  if (normalizedInput.versionId) {
    query.versionId = normalizedInput.versionId;
  }

  return this._fetchObject<GetObjectAclOutput>(input, 'GET', query, {});
}

export interface PutObjectAclInput {
  bucket?: string;
  key: string;
  versionId?: string;
  acl?: Acl;
  aclBody?: ObjectAclBody;
  headers?: {
    [key: string]: string | undefined;
    'x-tos-acl'?: Acl;
  };
}

export async function putObjectAcl(this: TOSBase, input: PutObjectAclInput) {
  const headers = (input.headers = normalizeHeadersKey(input.headers));
  const query: Record<string, any> = { acl: '' };
  if (input.versionId) {
    query.versionId = input.versionId;
  }
  fillRequestHeaders(input, ['acl']);

  return this._fetchObject<undefined>(
    input,
    'PUT',
    query,
    headers,
    input.aclBody
  );
}
