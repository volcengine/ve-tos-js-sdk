/** @file TOS 支持 QoSPolicy(流控策略管理) 相关接口  */
import { MergeExclusive } from 'type-fest';
import TOSBase from '../base';

export enum StringOp {
  StringEquals = 'StringEquals',
  StringNotEquals = 'StringNotEquals',
  StringEqualsIgnoreCase = 'StringEqualsIgnoreCase',
  StringNotEqualsIgnoreCase = 'StringNotEqualsIgnoreCase',
  StringLike = 'StringLike',
  StringNotLike = 'StringNotLike',
}
export enum DateOp {
  DateEquals = 'DateEquals',
  DateNotEquals = 'DateNotEquals',
  DateLessThan = 'DateLessThan',
  DateLessThanEquals = 'DateLessThanEquals',
  DateGreaterThan = 'DateGreaterThan',
  DateGreaterThanEquals = 'DateGreaterThanEquals',
}
export enum IpOp {
  IpAddress = 'IpAddress',
  NotIpAddress = 'NotIpAddress',
}

/** (共三种)条件的运算符 */
export type QosOp = StringOp | DateOp | IpOp;

/** 服务端模型 - 条件键值对 */
export type QosConditions = {
  [operator in string]?: {
    [key in string]: string[];
  };
};

/** 流控类别 */
export enum QuotaType {
  /** 写Qps */
  WritesQps = 'WritesQps',
  /** 读Qps */
  ReadsQps = 'ReadsQps',
  /** list类Qps */
  ListQps = 'ListQps',
  /** 写带宽 */
  WritesRate = 'WritesRate',
  /** 读带宽 */
  ReadsRate = 'ReadsRate',
}
export type QuotaTypes = {
  /** 写类 action Qps，取值为正整数 */
  [QuotaType.WritesQps]?: string;
  /** 读类 action Qps，取值为正整数 */
  [QuotaType.ReadsQps]?: string;
  /** list 类 action Qps，取值为正整数 */
  [QuotaType.ListQps]?: string;
  /** 写类 action 带宽，单位为 Mbps，取值为正整数 */
  [QuotaType.WritesRate]?: string;
  /** 读类 action 带宽，单位为 Mbps，取值为正整数 */
  [QuotaType.ReadsRate]?: string;
};

export type QosStatement = MergeExclusive<
  /** 适用的资源列表，不支持两个属性同时使用 */
  { Resource: string | string[] },
  { NotResource: string | string[] }
> &
  MergeExclusive<
    /** 适用的账户、用户或者角色，不支持两个属性同时使用 */
    { Principal: string[] },
    { NotPrincipal: string[] }
  > & {
    /** 策略名称，以区分不同的策略 */
    Sid: string;
    /** 流控策略的配额 */
    Quota: QuotaTypes;
    /** 指定策略在哪些情况下适用 quota */
    Condition?: QosConditions;
  };

/** 服务端预期接收的数据模型 */
export interface QosPolicy {
  /** 策略列表 */
  Statement: QosStatement[];
  /** API 接口版本号 */
  Version?: string;
  /** Cas 版本号 */
  CasVersion?: string;
}

export interface QosPolicyBaseInput {
  accountId: string;
}

export interface GetQosPolicyInput extends QosPolicyBaseInput {}
export interface GetQosPolicyOutput extends QosPolicy {
  Version: string;
  CasVersion: string;
}

export interface PutQosPolicyInput extends QosPolicy, QosPolicyBaseInput {}

export interface DeleteQosPolicyInput extends QosPolicyBaseInput {}

/**
 * @private unstable method
 * @description 拉取流控策略列表
 * @param {GetQosPolicyInput}
 * @returns {GetQosPolicyOutput}
 */
export async function getQosPolicy(this: TOSBase, params: GetQosPolicyInput) {
  const { accountId } = params;
  const res = await this.fetch<GetQosPolicyOutput>(
    'GET',
    '/qospolicy',
    {},
    {
      'x-tos-account-id': accountId,
    },
    {},
    {}
  );

  return res;
}

/**
 * @private unstable method
 * @description 更新流控策略列表 覆盖全部 QosPolicy
 * @param {PutQosPolicyInput}
 */
export async function putQosPolicy(this: TOSBase, params: PutQosPolicyInput) {
  const { accountId, ...restParams } = params;
  const res = await this.fetch(
    'PUT',
    '/qospolicy',
    {},
    {
      'x-tos-account-id': accountId,
    },
    {
      ...restParams,
    },
    {}
  );

  return res;
}

/**
 * @private unstable method
 * @description 拉取流控策略列表
 * @param {DeleteQosPolicyInput}
 */
export async function deleteQosPolicy(
  this: TOSBase,
  params: DeleteQosPolicyInput
) {
  const { accountId } = params;
  const res = await this.fetch(
    'DELETE',
    '/qospolicy',
    {},
    {
      'x-tos-account-id': accountId,
    },
    {},
    {}
  );

  return res;
}
