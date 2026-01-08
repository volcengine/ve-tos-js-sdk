/**
 * 文件元信息接口定义
 * @interface File
 * @property {string} FileName - 文件名称
 * @property {string} ETag - 文件ETag标识
 * @property {string} TOSObjectACL - TOS对象访问控制列表
 * @property {string} TOSStorageClass - TOS存储类型
 * @property {string} TOSCRC64 - TOS文件CRC64校验值
 * @property {string} ServerSideEncryption - 服务端加密方式
 * @property {string} EncryptionCustomerAlgorithm - 客户提供的加密算法
 * @property {string} FileModifiedTime - 文件修改时间（ISO 8601格式）
 * @property {number} Size - 文件大小（字节）
 * @property {number} TOSTaggingCount - TOS标签数量
 * @property {Record<string, string>} TOSTagging - TOS标签键值对
 * @property {Record<string, string>} TOSUserMeta - TOS用户元数据
 * @property {string} TOSVersionId - TOS文件版本ID
 * @property {string} TOSObjectType - TOS对象类型
 * @property {string} ContentType - 文件内容类型（MIME Type）
 * @property {string} TOSReplicationStatus - TOS复制状态
 * @property {boolean} TOSIsDeleteMarker - 是否为删除标记
 * @property {string} FileAccessTime - 文件访问时间（ISO 8601格式）
 * @property {string} FileCreateTime - 文件创建时间（ISO 8601格式）
 * @property {string} TOSExpiration - TOS文件过期时间（ISO 8601格式）
 * @property {number} Score - 向量距离评分 0 - 100
 */
export interface FileType {
  TOSBucketName: string;
  FileName: string;
  ETag: string;
  TOSObjectACL: string;
  TOSStorageClass: string;
  TOSCRC64: string;
  ServerSideEncryption?: string;
  ServerSideEncryptionCustomerAlgorithm?: string;
  FileModifiedTime: string;
  Size: number;
  TOSTaggingCount?: number;
  TOSTagging?: Record<string, string>;
  TOSUserMeta?: Record<string, string>;
  TOSVersionId?: string;
  TOSObjectType?: string;
  ContentType?: string;
  TOSReplicationStatus?: string;
  TOSIsDeleteMarker?: boolean;
  AccountId?: number;
  FileAccessTime?: string;
  CreateTime?: string;
  TOSExpiration?: string;
  Score?: number;
}