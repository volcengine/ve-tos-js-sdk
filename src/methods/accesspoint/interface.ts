import { AccessPointStatus } from "../../TosExportEnum";

export interface AccessPoint {
  Name: string; //规则名
  Alias: string; //别名
  Bucket: string; //绑定的桶名
  BucketAccountId: string; //绑定的桶所属的账号ID
  AccessPointType: 'Regular'; //接入点类型
  Status: AccessPointStatus; //状态;
  NetworkOrigin: 'internet' | 'vpc'; //网络类型
  VpcId?: string;
  CreationDate: number;
  AccessPointTrn: string;
  Endpoints: {
    ExtranetEndpoint: string;
    IntranetEndpoint: string;
  }
}

export interface CreateAccessPointInput {
  Name: string;
  Bucket: string;
  NetworkOrigin: AccessPoint['NetworkOrigin']
  BucketAccountId?: string;
  AccountId: string;
  VpcId?: string;
}

export interface CreateAccessPointOutput {
  AccessPointTrn: string;
  Alias: string;
}

export interface GetAccessPointInput {
  Name: string;
  AccountId: string;
}

export type GetAccessPointOutput = AccessPoint;

export interface DeleteAccessPointInput {
  Name: string;
  AccountId: string;
}

export interface DeleteAccessPointOutput {}

export interface ListAccessPointsInput {
  AccountId: string;
  maxResult?: number;
  nextToken?: string;
  bucket?: string;
}

export interface ListAccessPointsOutput {
  AccessPoints: AccessPoint[];
  NextToken?: string;
}

export interface BindAcceleratorWithAccessPointInput {
  AccountId: string;
  AccessPointName: string;
  AcceleratorId: string;
  AcceleratorAccountId?: string;
}

export interface BindAcceleratorWithAccessPointOutput {
}

export interface UnbindAcceleratorWithAccessPointInput {
  AccountId: string;
  AccessPointName: string;
  AcceleratorId: string;
}

export interface UnbindAcceleratorWithAccessPointOutput {
}

export interface ListBindAccessPointForAcceleratorInput {
  AccountId: string;
  AcceleratorId: string;
  nextToken?: string;
  maxResult?: number;
}

export interface ListBindAccessPointForAcceleratorOutput {
  AccessPoints: AccessPoint[];
  NextToken?: string;
}

