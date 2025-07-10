import { makeArrayProp, normalizeHeadersKey } from "../../utils";
import TOSBase, { TosResponse } from "../base";

export interface GetObjectAITagInput {
  bucket: string;
  key: string;
  versionId?: string;
}

export interface GetObjectAITagOutput {
  Confidence: number;
  FirstCategory: string;
  I18nFirstCategory: string;
  SecondCategory: string;
  I18nSecondCategory: string;
  Tag: string;
  I18nTag: string;
  TagDescription: string;
}

/**
 * @private unstable method
 */
export async function getObjectAITag(
  this: TOSBase,
  input: GetObjectAITagInput
): Promise<TosResponse<GetObjectAITagOutput[]>> {
  const { versionId } = input;
  const headers = normalizeHeadersKey({
    versionId,
  });
  const res = await this._fetchObject<any>(
    input,
    'GET',
    { ['x-tos-process']: 'image/aitag', ...headers },
    {}
  );
  makeArrayProp(res.data);
  return res;
}
