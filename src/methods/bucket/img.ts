import TOSBase, { TosResponse } from '../base';
import TosServerError from '../../TosServerError';
export interface ImageStyle {
  Name: string;
  Content: string;
  CreateTime: string;
  LastModifyTime: string;
}

export interface BucketImgStyle {
  bucket?: string;
  imageStyles: { ImageStyles: ImageStyle[] };
}

export interface ImageBriefInfo {
  Name: string;
  BucketLevelContent: string;
  PrefixCount: number;
}

export interface BucketImageBriefInfo {
  BucketName: string;
  ImageStyleBriefInfo: ImageBriefInfo[];
}

export interface GetImageStyleBriefInfoInput {
  bucket: string;
}

/**
 * @private unstable method
 */
export async function getImageStyleBriefInfo(
  this: TOSBase,
  req: GetImageStyleBriefInfoInput
): Promise<TosResponse<BucketImageBriefInfo>> {
  const { bucket } = req;
  try {
    const res = await this.fetchBucket<BucketImageBriefInfo>(
      bucket,
      'GET',
      {
        imageStyleBriefInfo: '',
      },
      {}
    );
    return res;
  } catch (err) {
    if (err instanceof TosServerError) {
      if (err.statusCode === 404) {
        return this.getNormalDataFromError(
          {
            BucketName: bucket,
            ImageStyleBriefInfo: [],
          },
          err
        );
      }
    }

    throw err;
  }
}

/**
 * @private unstable method
 */
export async function getBucketImageStyleList(
  this: TOSBase,
  bucket: string
): Promise<TosResponse<BucketImgStyle['imageStyles']>> {
  try {
    const res = await this.fetchBucket<BucketImgStyle['imageStyles']>(
      bucket,
      'GET',
      {
        imageStyle: '',
      },
      {}
    );
    return res;
  } catch (err) {
    if (err instanceof TosServerError) {
      if (err.statusCode === 404) {
        return this.getNormalDataFromError(
          {
            ImageStyles: [],
          },
          err
        );
      }
    }

    throw err;
  }
}

export interface GetBucketImageStyleListByNameInput {
  bucket: string;
  styleName: string;
}

/**
 * @private unstable method
 */
export async function getBucketImageStyleListByName(
  this: TOSBase,
  req: GetBucketImageStyleListByNameInput
): Promise<TosResponse<BucketImgStyle['imageStyles']>> {
  try {
    const { bucket, styleName } = req;
    const res = await this.fetchBucket<BucketImgStyle['imageStyles']>(
      bucket,
      'GET',
      {
        imageStyleContent: '',
        styleName,
      },
      {}
    );
    return res;
  } catch (err) {
    if (err instanceof TosServerError) {
      if (err.statusCode === 404) {
        return this.getNormalDataFromError(
          {
            ImageStyles: [],
          },
          err
        );
      }
    }

    throw err;
  }
}

/**
 * @private unstable method
 */
export async function getBucketImageStyle(
  this: TOSBase,
  bucket: string,
  styleName: string
): Promise<TosResponse<ImageStyle | null>> {
  try {
    const res = await this.fetchBucket<ImageStyle>(
      bucket,
      'GET',
      {
        imageStyle: '',
        styleName,
      },
      {}
    );
    return res;
  } catch (err) {
    if (err instanceof TosServerError) {
      if (err.statusCode === 404) {
        return this.getNormalDataFromError(null, err);
      }
    }

    throw err;
  }
}

export interface PutBucketImageStyleInput {
  bucket: string;
  styleName: string;
  content: string;
  styleObjectPrefix?: string;
}

/**
 * @private unstable method
 */
export async function putBucketImageStyle(
  this: TOSBase,
  req: PutBucketImageStyleInput
): Promise<TosResponse<any>> {
  const { bucket, styleName, content, styleObjectPrefix } = req;
  try {
    const res = await this.fetchBucket<any>(
      bucket,
      'PUT',
      {
        imageStyle: '',
        styleName,
        styleObjectPrefix,
      },
      {},
      { Content: content }
    );
    return res;
  } catch (err) {
    if (err instanceof TosServerError) {
      if (err.statusCode === 404) {
        return this.getNormalDataFromError(null, err);
      }
    }

    throw err;
  }
}

export interface DeleteBucketImageStyleInput {
  bucket: string;
  styleName: string;
  styleObjectPrefix?: string;
}

/**
 * @private unstable method
 */
export async function deleteBucketImageStyle(
  this: TOSBase,
  req: DeleteBucketImageStyleInput
): Promise<TosResponse<any>> {
  const { styleName, styleObjectPrefix, bucket } = req;
  try {
    const res = await this.fetchBucket<any>(
      bucket,
      'DELETE',
      {
        imageStyle: '',
        styleName,
        styleObjectPrefix,
      },
      {}
    );
    return res;
  } catch (err) {
    if (err instanceof TosServerError) {
      if (err.statusCode === 404) {
        return this.getNormalDataFromError(null, err);
      }
    }
    throw err;
  }
}

export interface BucketImgProtect {
  Enable: boolean;
  Suffixes?: string[];
  //原图保护规则（OSS支持10条），一期暂时不做，预留接口
  OIPRules?: any[];
  Prefix?: string;
  Suffix?: string;
}

/**
 * @private unstable method
 */
export async function putBucketImageProtect(
  this: TOSBase,
  bucket: string,
  data: BucketImgProtect
): Promise<TosResponse<any>> {
  try {
    const res = await this.fetchBucket<any>(
      bucket,
      'PUT',
      {
        originalImageProtect: '',
      },
      {},
      data
    );
    return res;
  } catch (err) {
    if (err instanceof TosServerError) {
      if (err.statusCode === 404) {
        return this.getNormalDataFromError(null, err);
      }
    }
    throw err;
  }
}

/**
 * @private unstable method
 */
export async function getBucketImageProtect(
  this: TOSBase,
  bucket: string
): Promise<TosResponse<any>> {
  try {
    const res = await this.fetchBucket<any>(
      bucket,
      'GET',
      {
        originalImageProtect: '',
      },
      {}
    );
    return res;
  } catch (err) {
    if (err instanceof TosServerError) {
      if (err.statusCode === 404) {
        return this.getNormalDataFromError(null, err);
      }
    }
    throw err;
  }
}
export type BucketImgProtectStyleSeparator = '-' | '_' | '!' | '\\';

export type BucketImgStyleSeparatorAffixes = Partial<
  Record<BucketImgProtectStyleSeparator, string>
>;

export interface PutBucketImageStyleSeparatorInput {
  bucket: string;
  Separator: BucketImgProtectStyleSeparator[];
  SeparatorSuffix?: BucketImgStyleSeparatorAffixes;
}

/**
 * @private unstable method
 */
export async function putBucketImageStyleSeparator(
  this: TOSBase,
  req: PutBucketImageStyleSeparatorInput
): Promise<TosResponse<any>> {
  const { bucket, Separator, SeparatorSuffix } = req;
  try {
    const res = await this.fetchBucket<any>(
      bucket,
      'PUT',
      {
        imageStyleSeparator: '',
      },
      {},
      { Separator, SeparatorSuffix }
    );
    return res;
  } catch (err) {
    if (err instanceof TosServerError) {
      if (err.statusCode === 404) {
        return this.getNormalDataFromError(null, err);
      }
    }
    throw err;
  }
}

/**
 * @private unstable method
 */
export async function getBucketImageStyleSeparator(
  this: TOSBase,
  bucket: string
): Promise<TosResponse<any>> {
  try {
    const res = await this.fetchBucket<any>(
      bucket,
      'GET',
      {
        imageStyleSeparator: '',
      },
      {}
    );
    return res;
  } catch (err) {
    if (err instanceof TosServerError) {
      if (err.statusCode === 404) {
        return this.getNormalDataFromError(null, err);
      }
    }
    throw err;
  }
}
