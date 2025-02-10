import { TosClientError } from './browser-index';
import { TOSBase, type TOSConstructorOptions } from './methods/base';
import { paramsSerializer } from './utils';
import { getObjectV2 } from './methods/object/getObject';
import headObject from './methods/object/headObject';
import { listObjectVersions, listObjects } from './methods/object/listObjects';
import downloadFile from './methods/object/downloadFile';
import { listObjectsType2 } from './methods/object/listObjectsType2';

export interface ShareLinkClientOptions
  extends Omit<
    TOSConstructorOptions,
    'region' | 'accessKeyId' | 'accessKeySecret' | 'endpoint' | 'bucket'
  > {
  policyUrl: string;
}

interface ParsedPolicyUrlVal {
  origin: string;
  host: string;
  search: string;
}

/** @private unstable */
export class ShareLinkClient extends TOSBase {
  shareLinkClientOpts: ShareLinkClientOptions;

  private parsedPolicyUrlVal: ParsedPolicyUrlVal;

  modifyAxiosInst() {
    const axiosInst = this.axiosInst;

    axiosInst.interceptors.request.use((config) => {
      const headers = config.headers || {};
      delete headers['authorization'];
      headers['host'] = this.parsedPolicyUrlVal.host;
      config.baseURL = this.parsedPolicyUrlVal.origin;
      config.paramsSerializer = (params) => {
        const addQueryStr = paramsSerializer(params);
        return [this.parsedPolicyUrlVal.search, addQueryStr]
          .filter((it) => it.trim())
          .join('&');
      };
      return config;
    });
  }

  constructor(_opts: ShareLinkClientOptions) {
    super({
      ..._opts,

      bucket: 'fake-bucket',
      region: 'fake-region',
      accessKeyId: 'fake-accessKeyId',
      accessKeySecret: 'fake-accessKeySecret',
      endpoint: 'fake-endpoint.com',
    });

    this.shareLinkClientOpts = _opts;
    this.parsedPolicyUrlVal = this.initParsedPolicyUrlVal();
    this.modifyAxiosInst();
  }

  private initParsedPolicyUrlVal(): ParsedPolicyUrlVal {
    const reg = /(https?:\/\/(?:[^@]+@)?([^/?]+))[^?]*\?(.+)/;
    const matched = this.shareLinkClientOpts.policyUrl.match(reg);
    if (!matched) {
      throw new TosClientError('the `policyUrl` param is invalid');
    }
    return {
      origin: matched[1],
      host: matched[2],
      search: matched[3],
    };
  }

  headObject = headObject;
  getObjectV2 = getObjectV2;
  listObjects = listObjects;
  listObjectsType2 = listObjectsType2;
  listObjectVersions = listObjectVersions;
  downloadFile = downloadFile;
}
