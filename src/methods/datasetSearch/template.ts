import TOSBase from "../base";

/**
 * 列举模板请求参数
 * @interface ListTemplatesParams
 */
export interface ListTemplatesParams {
  accountId: string;
}

/**
 * 列举模板响应结果
 * @interface ListTemplatesOutput
 * @property {string} RequestId - 本次请求request id
 * @property {string[]} Templates - 支持的模板生成接口定义列表
 */
export interface ListTemplatesOutput {
  RequestId: string;
  Templates: Array<{
    TemplateName: string;
    Description: string;
    TemplateId: string;
  }>;
}
/**
 * 列举模板接口
 * @param this TOSBase实例
 * @param input ListTemplatesParams
 * @returns ListTemplatesOutput
 * @private unstable 暂不对外
 */
export async function listTemplates(
  this: TOSBase,
  input: ListTemplatesParams
) {
  const { accountId } = input;
  const res = await this.fetch<ListTemplatesOutput>(
    'GET',
    '/templates',
    {}, // 无查询参数
    {
      'x-tos-account-id': accountId,
    },
    {}
  );
  return res;
}