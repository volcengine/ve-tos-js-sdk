import { TierType } from '../../TosExportEnum';

export interface RestoreInfo {
  RestoreStatus: RestoreStatus;
  RestoreParam?: RestoreParam;
}

export type RestoreStatus = {
  OngoingRequest: boolean;
  ExpiryDate?: string;
};

export type RestoreParam = {
  RequestDate: string;
  ExpiryDays: number;
  Tier: TierType;
};

export enum TosHeader {
  HeaderRestore = 'x-tos-restore',
  HeaderRestoreExpiryDays = 'x-tos-restore-expiry-days',
  HeaderRestoreRequestDate = 'x-tos-restore-request-date',
  HeaderRestoreTier = 'x-tos-restore-tier',
  HeaderProjectName = 'x-tos-project-name',
  HeaderReplicationStatus = 'x-tos-replication-status',
}

export const RestoreOngoingRequestTrueStr = 'ongoing-request="true"';
export const RestoreOngoingRequestFalseReg = 'ongoing-request="false"';
