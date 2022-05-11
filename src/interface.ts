export type Headers = { [key: string]: string | undefined };

export interface AclInterface {
  Owner: { ID: string };
  Grants: {
    Grantee: {
      ID: string;
      Type: string;
      Canned: string;
    };
    Permission: 'READ' | 'WRITE' | 'READ_ACP' | 'WRITE_ACP' | 'FULL_CONTROL';
  }[];
}

export type Acl =
  | 'private'
  | 'public-read'
  | 'public-read-write'
  | 'authenticated-read'
  | 'bucket-owner-read'
  | 'bucket-owner-full-control';

export type StorageClass = 'STANDARD' | 'IA';

export type ServerSideEncryption = 'AES256';
