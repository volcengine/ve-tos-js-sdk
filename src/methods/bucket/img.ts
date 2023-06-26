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

/**
 * @private unstable method
 */
export async function putBucketImageStyle(
  this: TOSBase,
  bucket: string,
  styleName: string,
  content: string
): Promise<TosResponse<any>> {
  try {
    const res = await this.fetchBucket<any>(
      bucket,
      'PUT',
      {
        imageStyle: '',
        styleName,
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

/**
 * @private unstable method
 */
export async function deleteBucketImageStyle(
  this: TOSBase,
  bucket: string,
  styleName: string
): Promise<TosResponse<any>> {
  try {
    const res = await this.fetchBucket<any>(
      bucket,
      'DELETE',
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

export interface BucketImgProtect {
  Enable: boolean;
  Suffixes?: string[];
  //原图保护规则（OSS支持10条），一期暂时不做，预留接口
  OIPRules?: any[];
  Prefix?: string;
  Suffix?: string;
}
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

/**
 * @private unstable method
 */
export async function putBucketImageStyleSeparator(
  this: TOSBase,
  bucket: string,
  Separator: BucketImgProtectStyleSeparator[]
): Promise<TosResponse<any>> {
  try {
    const res = await this.fetchBucket<any>(
      bucket,
      'PUT',
      {
        imageStyleSeparator: '',
      },
      {},
      { Separator }
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
