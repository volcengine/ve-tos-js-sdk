import { ACLType, StorageClassType } from './TosExportEnum';

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

export type Acl = ACLType;
export type StorageClass = StorageClassType;

export type ServerSideEncryption = 'AES256';
