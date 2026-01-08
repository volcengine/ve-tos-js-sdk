export interface Subnet {
  SubnetId: string;
  ZoneId: string;
}

export interface CreateAnyPrivateAccessPointInput {
  Name: string;
  AccountId: string;
  VpcId: string;
  Subnets: Subnet[];
  SecurityGroupId: string;
}

export interface CreateAnyPrivateAccessPointOutput {
  Id: string;
}

export interface AnyPrivateAccessPoint {
  Name: string;
  Id: string;
  VpcId: string;
  Subnets: Subnet[];
  SecurityGroupId: string;
  Status: 'CREATING' | 'READY' | 'FAILED';
  Message?: string;
  Region: string;
  CreateTime: number;
  UpdateTime: number;
}

export interface ListAnyPrivateAccessPointsInput {
  AccountId: string;
  maxResult?: number;
  nextToken?: string;
}

export interface ListAnyPrivateAccessPointsOutput {
  AnyPrivateAccessPoints: AnyPrivateAccessPoint[];
  NextToken?: string;
  IsTruncated: boolean;
}

export interface ListAnyPrivateAccessPointSupportAzInput {
  AccountId: string;
}

export interface ListAnyPrivateAccessPointSupportAzOutput {
  SupportAZ: string[];
}

export interface AnyPrivateAccessPointSupportEndpoint {
  TosEndpoint: string;
  S3Endpoint: string;
}

export interface ListAnyPrivateAccessPointEndpointsInput {
  AccountId: string;
}

export interface ListAnyPrivateAccessPointEndpointsOutput {
  Endpoints: AnyPrivateAccessPointSupportEndpoint[];
}

