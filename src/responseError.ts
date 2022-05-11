import { AxiosResponse } from 'axios';
import { Headers } from './interface';

export interface ResponseErrorData {
  Code: string;
  HostId: string;
  Message: string;
  RequestId: string;
}

export class ResponseError extends Error {
  /**
   * is original from backend, equals `data.Code`
   */
  public code: string;

  /**
   * the body when backend errors
   */
  public data: ResponseErrorData;
  /**
   * status code
   */
  public statusCode: number;
  /**
   * response headers
   */
  public headers: Headers;

  /**
   * identifies the errored request, equals to headers['x-tos-request-id'].
   * If you has any question about the request, please send the requestId to TOS worker.
   */
  public requestId: string;

  constructor(response: AxiosResponse<ResponseErrorData>) {
    const { data } = response;
    super(data.Message);

    // https://www.dannyguo.com/blog/how-to-fix-instanceof-not-working-for-custom-errors-in-typescript/
    Object.setPrototypeOf(this, ResponseError.prototype);

    this.data = data;
    this.code = data.Code;
    this.statusCode = response.status;
    this.headers = response.headers;
    this.requestId = response.headers['x-tos-request-id'];
  }
}

export default ResponseError;
