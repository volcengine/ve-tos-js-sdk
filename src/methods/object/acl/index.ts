import { Acl, AclInterface } from '../../../interface';
import { fillRequestHeaders, normalizeHeadersKey } from '../../../utils';
import TOSBase from '../../base';

export interface GetObjectAclInput {
  bucket?: string;
  key: string;
  versionId?: string;
}

export type GetObjectAclOutput = AclInterface;

export async function getObjectAcl(
  this: TOSBase,
  input: GetObjectAclInput | string
) {
  const normalizedInput = typeof input === 'string' ? { key: input } : input;
  const query: Record<string, any> = { acl: '' };
  if (normalizedInput.versionId) {
    query.versionId = normalizedInput.versionId;
  }

  return this.fetchObject<GetObjectAclOutput>(input, 'GET', query, {});
}

export interface PutObjectAclInput {
  bucket?: string;
  key: string;
  versionId?: string;
  acl: 'default' | Acl;
  grantFullControl?: string;
  grantRead?: string;
  grantReadAcp?: string;
  grantWriteAcp?: string;

  headers?: {
    [key: string]: string | undefined;
    'x-tos-acl'?: 'default' | Acl;
  };
}

export async function putObjectAcl(this: TOSBase, input: PutObjectAclInput) {
  const query: Record<string, any> = { acl: '' };
  if (input.versionId) {
    query.versionId = input.versionId;
  }
  const headers = (input.headers = normalizeHeadersKey(input.headers));
  fillRequestHeaders(input, [
    'acl',
    'grantFullControl',
    'grantRead',
    'grantReadAcp',
    'grantWriteAcp',
  ]);

  return this.fetchObject<undefined>(input, 'PUT', query, headers);
}
