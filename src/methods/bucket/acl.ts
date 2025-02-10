import TOSBase from '../base';
import { Headers, AclInterface, Acl } from '../../interface';
import { makeArrayProp } from '../../utils';

export type GetBucketAclOutput = AclInterface;

export interface PutBucketAclInput {
  bucket?: string;
  acl?: Acl;
  aclBody?: AclInterface;
}

export async function putBucketAcl(this: TOSBase, input: PutBucketAclInput) {
  const headers: Headers = {};
  if (input.acl) headers['x-tos-acl'] = input.acl;

  const res = await this.fetchBucket(
    input.bucket,
    'PUT',
    { acl: '' },
    headers,
    input.aclBody,
    { needMd5: true }
  );
  return res;
}

export async function getBucketAcl(this: TOSBase, bucket?: string) {
  const res = await this.fetchBucket<GetBucketAclOutput>(
    bucket,
    'GET',
    {
      acl: '',
    },
    {}
  );
  const arrayProp = makeArrayProp(res.data);
  arrayProp('Grants');
  return res;
}
