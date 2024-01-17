import {
  ACLType,
  CannedType,
  GranteeType,
  PermissionType,
  TosClient,
} from '../../src';
import { NEVER_TIMEOUT } from '../utils';
import { tosOptions } from '../utils/options';

describe('object acl', () => {
  it(
    'set and get by headers',
    async () => {
      const client = new TosClient(tosOptions);
      const key = 'object-acl-set-and-get-by-headers';
      await client.putObject(key);
      await client.putObjectAcl({
        key,
        acl: ACLType.ACLPublicReadWrite,
      });

      {
        const { data } = await client.getObjectAcl({
          key,
        });

        expect(data.Grants[0].Grantee.Canned).toBe('AllUsers');
        expect(data.BucketOwnerEntrusted).not.toBe(true);
      }

      // headers 有更高优先级
      await client.putObjectAcl({
        key,
        acl: ACLType.ACLPublicReadWrite,
        headers: {
          'x-tos-acl': ACLType.ACLBucketOwnerEntrusted,
        },
      });

      {
        const { data } = await client.getObjectAcl({
          key,
        });
        expect(data.BucketOwnerEntrusted).toBe(true);
      }
    },
    NEVER_TIMEOUT
  );

  it(
    'set and get by body',
    async () => {
      const client = new TosClient(tosOptions);
      const key = 'object-acl-set-and-get-by-body';
      await client.putObject(key);
      await client.putObjectAcl({
        key,
        aclBody: {
          Owner: {
            ID: 'AccountID',
          },
          Grants: [
            {
              Grantee: {
                ID: 'userId',
                Type: GranteeType.GranteeUser,
              },
              Permission: PermissionType.PermissionRead,
            },
          ],
        },
      });

      {
        const { data } = await client.getObjectAcl({
          key,
        });
        expect(data.Grants[0].Grantee.Type).toBe(GranteeType.GranteeUser);
      }

      await client.putObjectAcl({
        key,
        aclBody: {
          Owner: {
            ID: 'ownerid',
          },
          Grants: [
            {
              Grantee: {
                Canned: CannedType.CannedAuthenticatedUsers,
                Type: GranteeType.GranteeGroup,
              },
              Permission: PermissionType.PermissionFullControl,
            },
          ],
        },
      });
      {
        const { data } = await client.getObjectAcl({
          key,
        });
        expect(data.Grants[0].Grantee.Type).toBe(GranteeType.GranteeGroup);
      }

      await client.putObjectAcl({
        key,
        aclBody: {
          Owner: {
            ID: 'ownerid',
          },
          Grants: [
            {
              Grantee: {
                Canned: CannedType.CannedAuthenticatedUsers,
                Type: GranteeType.GranteeGroup,
              },
              Permission: PermissionType.PermissionFullControl,
            },
          ],
          BucketOwnerEntrusted: true,
        },
      });
      {
        const { data } = await client.getObjectAcl({
          key,
        });
        expect(data.BucketOwnerEntrusted).toBe(true);
      }
    },
    NEVER_TIMEOUT
  );
});
